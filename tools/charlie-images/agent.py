#!/usr/bin/env python3
"""VIRIATTO/BOXEUP: Charlie images, originals preserved, cautious publication."""
import argparse, base64, io, json, os, re, time, unicodedata
from pathlib import Path
from urllib.parse import urlparse
import requests
from PIL import Image, ImageFilter, ImageOps

OUT=Path("charlie-image-output")
API="2026-10"
CATS={
 "Luvas de Boxe":("guantes",),
 "Luvas de MMA":("guantillas","mma"),
 "Capacetes de Boxe":("casco","proteccion"),
 "Caneleiras":("espinilleras","proteccion"),
 "Proteções":("proteccion","botin","coquilla"),
 "Boqueiras":("bucal","proteccion"),
 "Luvas Infantis":("guantes","junior"),
 "Garrafas de Treino":("equipamiento","botella","gimnasio"),
 "Ligaduras":("venda","proteccion"),
 "Equipamento de Treino":("equipamiento","gimnasio","entrenamiento"),
 "Linha Cabron":("cabron","saco"),
 "Júnior":("junior","infantil"),
 "Cordas de Saltar":("comba","entrenamiento"),
 "Calçado":("calzado","bota","zapatilla"),
 "Karate":("karate","kimono","cinturon"),
 "Mochilas e Sacos":("bolsa","bolso","mochila"),
 "Calções Muay Thai":("muay","short","kick"),
 "Vestuário de Combate":("boxeo","mma","ropa"),
 "Fitness":("fitness",),
 "Moda Kanalla":("kanalla","moda","camiseta"),
 "Bazar e Acessórios":("bazar","accesorio"),
 "Equipamento Infantil":("junior","infantil"),
 "Sacos e Mochilas":("bolsa","mochila","saco")
}

def norm(s):
    s=unicodedata.normalize("NFKD",str(s).lower())
    s="".join(c for c in s if not unicodedata.combining(c))
    return " ".join(re.findall(r"[a-z0-9]+",s))

_AUTH_CACHE={"token":None,"expiry":0}
def access_token(shop):
    token=os.getenv("SHOPIFY_ADMIN_ACCESS_TOKEN")
    if token:
        return token
    if _AUTH_CACHE["token"] and time.time()<_AUTH_CACHE["expiry"]:
        return _AUTH_CACHE["token"]
    client_id=os.environ["SHOPIFY_CLIENT_ID"]
    client_secret=os.environ["SHOPIFY_CLIENT_SECRET"]
    r=requests.post("https://"+shop+"/admin/oauth/access_token",
        data={"grant_type":"client_credentials",
              "client_id":client_id,"client_secret":client_secret},timeout=35)
    r.raise_for_status()
    result=r.json()
    _AUTH_CACHE["token"]=result["access_token"]
    _AUTH_CACHE["expiry"]=time.time()+max(60,int(result.get("expires_in",3600))-180)
    return _AUTH_CACHE["token"]

def shopify(q,vars=None):
    shop=os.environ["SHOPIFY_SHOP"].strip().lower()
    if not re.fullmatch(r"[a-z0-9][a-z0-9.-]*\.myshopify\.com",shop):
        raise ValueError("SHOPIFY_SHOP inválido: usar *.myshopify.com")
    r=requests.post("https://"+shop+"/admin/api/"+API+"/graphql.json",
        json={"query":q,"variables":vars or {}},
        headers={"X-Shopify-Access-Token":access_token(shop)},
        timeout=45)
    r.raise_for_status()
    obj=r.json()
    if obj.get("errors"):
        raise RuntimeError(str(obj["errors"]))
    return obj["data"]

def targets():
    q='''query($after:String){products(first:50,after:$after,query:"vendor:Charlie"){
      pageInfo{hasNextPage endCursor} nodes{id title vendor productType tags
      media(first:1){nodes{id}}}}}'''
    after=None
    while True:
        res=shopify(q,{"after":after})["products"]
        for p in res["nodes"]:
            if (norm(p["vendor"])=="charlie" and
                "foto-por-adicionar" in p["tags"] and
                not p["media"]["nodes"]):
                yield p
        if not res["pageInfo"]["hasNextPage"]:
            break
        after=res["pageInfo"]["endCursor"]

def model(p):
    first=p["title"].split(" — ")[0]
    first=re.sub(r"^Charlie\s+","",first,flags=re.I)
    first=re.split(r"\s+-\s*",first)[0]
    return norm(first)

def source(p):
    name=model(p)
    if len(name)<5 or name in ("gel","retro","blast y gold"):
        raise ValueError("modelo genérico; requer verificação manual")
    hints=CATS.get(p["productType"])
    if not hints:
        raise ValueError("categoria sem regra de correspondência")
    res=requests.get("https://charlie.es/wp-json/wc/store/v1/products",
        params={"search":p["title"].split(" — ")[0].removeprefix("Charlie ").split(" - ")[0],"per_page":50},timeout=40,
        headers={"User-Agent":"VIRIATTO-Image-Agent/1.0"})
    res.raise_for_status()
    catalog=res.json()
    if not isinstance(catalog,list):
        raise ValueError("API oficial da Charlie indisponível")
    chosen=[]
    for x in catalog:
        title=norm(x.get("name",""))
        ct=" ".join(norm(str(c.get("name",""))+" "+str(c.get("slug","")))
                    for c in x.get("categories",[]))
        t=title.split()
        if not all(w in t for w in name.split()):
            continue
        if "pack" in t and "pack" not in name.split():
            continue
        if not any(h in ct for h in hints) or not x.get("images"):
            continue
        extra=[w for w in t if w not in name.split() and w not in
            ("guante","guantes","casco","cascos","espinillera","espinilleras",
             "de","boxeo","charlie","mma","profesional")]
        if len(extra)>4:
            continue
        chosen.append(x)
    if len(chosen)!=1:
        raise ValueError(f"{len(chosen)} correspondências oficiais; não é seguro publicar")
    obj=chosen[0]
    url=obj["images"][0].get("src","")
    host=urlparse(url)
    if host.scheme!="https" or not (host.hostname=="charlie.es" or
                                   (host.hostname or "").endswith(".charlie.es")):
        raise ValueError("fotografia fora do domínio oficial Charlie")
    if not host.path.lower().endswith((".jpg",".jpeg",".png",".webp")):
        raise ValueError("formato de fotografia não validado")
    return {"url":url,"page":obj.get("permalink"),"name":obj.get("name")}

def original(url):
    r=requests.get(url,timeout=60,stream=True)
    r.raise_for_status()
    raw=bytearray()
    for chunk in r.iter_content(65536):
        raw+=chunk
        if len(raw)>15_000_000:
            raise ValueError("imagem maior que 15 MB")
    im=ImageOps.exif_transpose(Image.open(io.BytesIO(raw))).convert("RGB")
    if min(im.size)<500:
        raise ValueError(f"imagem original demasiado pequena: {im.size}")
    return im

def background():
    if os.getenv("OPENAI_API_KEY"):
        from openai import OpenAI
        out=OpenAI().images.generate(
            model=os.getenv("OPENAI_IMAGE_MODEL","gpt-image-2.5-flare"),
            size="1024x1024",quality="medium",output_format="png",
            prompt=("Empty product photography studio BACKGROUND ONLY. "
                    "Square anthracite-to-graphite gradient wall, gentle overhead "
                    "spotlight, subdued matte dark concrete floor and shadows. "
                    "No text, no logos, no products, no humans."))
        return Image.open(io.BytesIO(base64.b64decode(out.data[0].b64_json))
                        ).convert("RGB").resize((1024,1024))
    # A deterministic fallback prevents changing the product when AI is unavailable.
    from PIL import ImageDraw
    canvas=Image.new("RGB",(1024,1024))
    d=ImageDraw.Draw(canvas)
    for y in range(1024):
        n=12+int(37*max(0,1-((y-430)/870)**2))
        d.line((0,y,1024,y),fill=(n,n,n))
    return canvas

def render(orig,bg):
    from rembg import remove,new_session
    cut=remove(orig,session=new_session("u2netp")).convert("RGBA")
    bbox=cut.getchannel("A").getbbox()
    if not bbox:
        raise ValueError("não foi detetado produto")
    cut=cut.crop(bbox)
    cut.thumbnail((855,790),Image.Resampling.LANCZOS)
    x=(1024-cut.width)//2
    y=max(45,(925-cut.height)//2)
    shadow=Image.new("RGBA",(1024,1024),(0,0,0,0))
    alpha=Image.new("L",(1024,1024),0)
    alpha.paste(cut.getchannel("A"),(x+18,y+25))
    alpha=alpha.filter(ImageFilter.GaussianBlur(32)).point(lambda a:int(a*.35))
    shadow.putalpha(alpha)
    image=Image.alpha_composite(bg.convert("RGBA"),shadow)
    image.alpha_composite(cut,(x,y))
    return image.convert("RGB")

def attach(p,path):
    # Check again to avoid overwriting a product updated in the meantime.
    latest=shopify('''query($id:ID!){product(id:$id){
        id media(first:1){nodes{id}}}}''',{"id":p["id"]})["product"]
    if not latest or latest["media"]["nodes"]:
        raise ValueError("já tem imagens ou foi eliminado; cancelado")
    r=shopify('''mutation($input:[StagedUploadInput!]!){
        stagedUploadsCreate(input:$input){stagedTargets{
        url resourceUrl parameters{name value}} userErrors{message}}}''',
        {"input":[{"resource":"PRODUCT_IMAGE","filename":path.name,
                   "mimeType":"image/jpeg","httpMethod":"POST"}]}
        )["stagedUploadsCreate"]
    if r["userErrors"] or len(r["stagedTargets"])!=1:
        raise RuntimeError("stagedUploadsCreate: "+str(r["userErrors"]))
    t=r["stagedTargets"][0]
    form={a["name"]:a["value"] for a in t["parameters"]}
    with path.open("rb") as fd:
        upload=requests.post(t["url"],data=form,
            files={"file":(path.name,fd,"image/jpeg")},timeout=120)
    upload.raise_for_status()
    r=shopify('''mutation($files:[FileCreateInput!]!){fileCreate(files:$files){
        files{id fileStatus} userErrors{message}}}''',
        {"files":[{"originalSource":t["resourceUrl"],"contentType":"IMAGE",
                  "alt":p["title"]+" — fotografia Charlie"}]})["fileCreate"]
    if r["userErrors"] or not r["files"]:
        raise RuntimeError("fileCreate: "+str(r["userErrors"]))
    file_id=r["files"][0]["id"]
    for i in range(12):
        node=shopify('''query($id:ID!){node(id:$id){
          ... on MediaImage{fileStatus}}}''',{"id":file_id})["node"]
        if node and node.get("fileStatus")=="READY":
            break
        if node and node.get("fileStatus")=="FAILED":
            raise RuntimeError("ficheiro rejeitado pelo Shopify")
        time.sleep(5)
    else:
        raise RuntimeError("ficheiro não ficou pronto")
    updated=shopify('''mutation($files:[FileUpdateInput!]!){fileUpdate(files:$files){
        files{id} userErrors{message}}}''',
        {"files":[{"id":file_id,"referencesToAdd":[p["id"]]}]})["fileUpdate"]
    if updated["userErrors"]:
        raise RuntimeError(str(updated["userErrors"]))
    for i in range(8):
        time.sleep(3)
        nodes=shopify('''query($id:ID!){product(id:$id){
            media(first:15){nodes{id}}}}''',{"id":p["id"]})["product"]
        if any(n["id"]==file_id for n in nodes["media"]["nodes"]):
            return file_id
    raise RuntimeError("ficheiro criado, mas ligação ao produto não confirmada")

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--mode",choices=["scan","prepare","publish"],default="scan")
    ap.add_argument("--limit",type=int,default=20)
    opts=ap.parse_args()
    if opts.limit<1:
        ap.error("limit deve ser maior que zero")
    OUT.mkdir(exist_ok=True)
    products=list(targets())
    print("Produtos Charlie sem fotos:",len(products))
    entries=[]
    bg=None
    for p in products[:opts.limit]:
        row={"product":p["title"],"id":p["id"],"status":"skipped"}
        try:
            ref=source(p)
            row["official_source"]=ref
            row["status"]="matched"
            if opts.mode!="scan":
                orig=original(ref["url"])
                if bg is None:
                    bg=background()
                img=render(orig,bg)
                path=OUT/(p["id"].split("/")[-1]+".jpg")
                img.save(path,"JPEG",quality=92,optimize=True)
                row["output"]=str(path)
                row["status"]="prepared"
                if opts.mode=="publish":
                    row["shopify_media_id"]=attach(p,path)
                    row["status"]="published"
        except Exception as ex:
            row["error"]=str(ex)
            row["status"]="skipped"
        print(row["status"],p["title"],row.get("error",""))
        entries.append(row)
    (OUT/"report.json").write_text(json.dumps(entries,indent=2,ensure_ascii=False),
                                 encoding="utf-8")
    print("Relatório:",OUT/"report.json")

if __name__=="__main__":
    main()
