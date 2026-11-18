"""
Idempotent demo data for the jewelry atelier.

    python manage.py seed_data            # create or update categories and items
    python manage.py seed_data --flush    # remove all catalog data first

Items are matched by SKU and categories by slug, so running the command
repeatedly never creates duplicates.
"""

from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from jewelry.models import Category, JewelryImage, JewelryItem


def unsplash(photo_id: str, width: int = 1600) -> str:
    return f"https://images.unsplash.com/photo-{photo_id}?auto=format&fit=crop&w={width}&q=80"


# Editorial / lifestyle shots reused in galleries.
ON_HAND = unsplash("1596944924616-7b38e7cfac36")
ON_HAND_LAYERED = unsplash("1633934542430-0905ccb5f050")
GIFT_BOX_RINGS = unsplash("1631982690223-8aa4be0a2497")
GIFT_BOX_STACK = unsplash("1584302179602-e4c3d3fd629d")
ON_NECK_DELICATE = unsplash("1611652022419-a9419f74343d")
ON_NECK_LAYERED = unsplash("1610694955371-d4a3e0ce4b52")
ON_EAR = unsplash("1600721391776-b5cd0e0048f9")
FLATLAY = unsplash("1576053139778-7e32f2ae3cfd")

CATEGORIES = [
    {
        "slug": "zasnubne-prstene",
        "name": "Zásnubné prstene",
        "description": "Solitéry a halo prstene s certifikovanými diamantmi a drahokamami – ručne osadené v našom ateliéri.",
        "cover_image_url": unsplash("1605100804763-247f67b3557e"),
    },
    {
        "slug": "svadobne-obrucky",
        "name": "Svadobné obrúčky",
        "description": "Obrúčky z 14k a 18k zlata či platiny s komfortným profilom, gravírovaním a doživotným servisom.",
        "cover_image_url": unsplash("1622398925373-3f91b1e275f5"),
    },
    {
        "slug": "nahrdelniky",
        "name": "Náhrdelníky",
        "description": "Jemné retiazky, perlové náhrdelníky a prívesky s diamantmi, ktoré sa nosia každý deň aj pri výnimočných príležitostiach.",
        "cover_image_url": unsplash("1589128777073-263566ae5e4d"),
    },
    {
        "slug": "nausnice",
        "name": "Náušnice",
        "description": "Diamantové puzetky, zafírové kvapky a zlaté kruhy – od decentnej elegancie po večerný lesk.",
        "cover_image_url": ON_EAR,
    },
    {
        "slug": "naramky",
        "name": "Náramky",
        "description": "Tenisové náramky s diamantmi a masívne zlaté retiazky s precíznym zapínaním.",
        "cover_image_url": unsplash("1573408301185-9146fe634ad0"),
    },
    {
        "slug": "investicne-zlato",
        "name": "Investičné zlato",
        "description": "Certifikované zlaté tehličky a mince rýdzosti 999,9/1000 od rafinérií so štandardom LBMA – oslobodené od DPH.",
        "cover_image_url": unsplash("1624365169364-0640dd10e180"),
    },
]

# (sku, category_slug, data, gallery[(photo, caption)])
ITEMS = [
    # --- Zásnubné prstene ----------------------------------------------------
    {
        "sku": "ZP-AUR-001",
        "category": "zasnubne-prstene",
        "name": "Solitér Emerald Cut",
        "collection_name": "Klasik Solitaire",
        "base_price": "6890.00",
        "metal_type": "zlte_zlato",
        "gold_purity": "18k (750/1000)",
        "primary_gemstone": "diamant",
        "carat_weight": "1.00",
        "diamond_grade": "F / VS1, GIA certifikát",
        "weight_grams": "3.85",
        "availability": "skladom",
        "badge": "bestseller",
        "is_featured": True,
        "cover_image_url": unsplash("1598560917807-1bae44bd2be8"),
        "description": (
            "Nadčasový solitér s jednokarátovým prírodným diamantom v smaragdovom brúse, ktorého "
            "schodovité fazety odrážajú svetlo v pokojných, zrkadlových zábleskoch. Kameň je osadený "
            "v štvorkolíkovom kotlíku z 18-karátového žltého zlata a ramená prsteňa zdobí jemný pavé "
            "rad diamantov. Každý kus dodávame s certifikátom GIA a puncovou značkou Puncového úradu SR."
        ),
        "gallery": [
            (unsplash("1598560917807-1bae44bd2be8"), "Detail osadenia kameňa"),
            (ON_HAND, "Na ruke"),
            (GIFT_BOX_RINGS, "Darčekové balenie"),
        ],
    },
    {
        "sku": "ZP-AUR-002",
        "category": "zasnubne-prstene",
        "name": "Prsteň Halo Rosé",
        "collection_name": "Kolekcia Aura",
        "base_price": "2450.00",
        "metal_type": "ruzove_zlato",
        "gold_purity": "14k (585/1000)",
        "primary_gemstone": "diamant",
        "carat_weight": "0.50",
        "diamond_grade": "G / VS2, IGI certifikát",
        "weight_grams": "3.20",
        "availability": "skladom",
        "badge": "novinka",
        "is_featured": True,
        "cover_image_url": unsplash("1605100804763-247f67b3557e"),
        "description": (
            "Okrúhly briliant 0,50 ct obklopený svätožiarou drobných diamantov, ktorá opticky zväčšuje "
            "stredový kameň a dodáva mu výnimočnú iskru. Rozdelené ramená z ružového 14k zlata pôsobia "
            "jemne a romanticky – ideálny zásnubný prsteň pre nevestu, ktorá miluje vintage eleganciu."
        ),
        "gallery": [
            (unsplash("1605100804763-247f67b3557e"), "Detail osadenia kameňa"),
            (ON_HAND_LAYERED, "Na ruke"),
            (GIFT_BOX_STACK, "Darčekové balenie"),
        ],
    },
    {
        "sku": "ZP-AUR-003",
        "category": "zasnubne-prstene",
        "name": "Prsteň s ružovým zafírom Cushion",
        "collection_name": "Kolekcia Aura",
        "base_price": "3190.00",
        "metal_type": "ruzove_zlato",
        "gold_purity": "14k (585/1000)",
        "primary_gemstone": "zafir",
        "carat_weight": "1.20",
        "diamond_grade": "Ružový zafír zo Srí Lanky, certifikát GRS",
        "weight_grams": "3.40",
        "availability": "skladom",
        "badge": "limitovana_edicia",
        "is_featured": True,
        "cover_image_url": unsplash("1603561591411-07134e71a2a9"),
        "description": (
            "Ružový cejlónsky zafír v brúse cushion s hmotnosťou 1,20 ct, rámovaný halo vencom "
            "z prírodných diamantov. Zafír je po diamante druhým najtvrdším drahokamom, preto je "
            "vhodný na každodenné nosenie. Limitovaná edícia – vyrobených len 12 kusov."
        ),
        "gallery": [
            (unsplash("1603561591411-07134e71a2a9"), "Detail osadenia kameňa"),
            (unsplash("1603561596112-0a132b757442"), "Bočný profil"),
            (GIFT_BOX_RINGS, "Darčekové balenie"),
        ],
    },
    {
        "sku": "ZP-LAB-004",
        "category": "zasnubne-prstene",
        "name": "Prsteň Pear Halo",
        "collection_name": "Kolekcia Lumière",
        "base_price": "2790.00",
        "metal_type": "biele_zlato",
        "gold_purity": "14k (585/1000)",
        "primary_gemstone": "lab_diamant",
        "carat_weight": "1.50",
        "diamond_grade": "E / VVS2, IGI certifikát",
        "weight_grams": "3.60",
        "availability": "na_objednavku",
        "badge": "none",
        "is_featured": False,
        "cover_image_url": unsplash("1607703829739-c05b7beddf60"),
        "description": (
            "Kvapkovitý lab-grown diamant 1,50 ct s chemicky aj opticky identickými vlastnosťami ako "
            "prírodný diamant – za zlomok ceny a s transparentným pôvodom. Dvojité halo a pavé ramená "
            "z bieleho 14k zlata s rhodiovou úpravou. Vyrábame na mieru do 2–3 týždňov."
        ),
        "gallery": [
            (unsplash("1607703829739-c05b7beddf60"), "Detail osadenia kameňa"),
            (ON_HAND, "Na ruke"),
        ],
    },
    {
        "sku": "ZP-PLT-005",
        "category": "zasnubne-prstene",
        "name": "Platinový prsteň Cushion Halo",
        "collection_name": "Klasik Solitaire",
        "base_price": "5450.00",
        "metal_type": "platina",
        "gold_purity": "950/1000",
        "primary_gemstone": "diamant",
        "carat_weight": "0.70",
        "diamond_grade": "F / VS1, GIA certifikát",
        "weight_grams": "5.10",
        "availability": "skladom",
        "badge": "none",
        "is_featured": False,
        "cover_image_url": unsplash("1586104195538-050b9f74f58e"),
        "description": (
            "Platina 950 je hustá, hypoalergénna a prirodzene biela – nikdy nežltne a drží kameň "
            "s maximálnou istotou. Stredový diamant 0,70 ct v kotlíku cushion je obkolesený halo "
            "vencom, ktorý prsteňu dodáva luxusný, no stále decentný výraz."
        ),
        "gallery": [
            (unsplash("1586104195538-050b9f74f58e"), "Detail osadenia kameňa"),
            (GIFT_BOX_STACK, "Darčekové balenie"),
        ],
    },
    # --- Svadobné obrúčky ----------------------------------------------------
    {
        "sku": "SO-KLA-101",
        "category": "svadobne-obrucky",
        "name": "Obrúčka Klasik Comfort 4 mm",
        "collection_name": "Kolekcia Večnosť",
        "base_price": "590.00",
        "metal_type": "zlte_zlato",
        "gold_purity": "14k (585/1000)",
        "primary_gemstone": "bez_kamena",
        "carat_weight": None,
        "diamond_grade": None,
        "weight_grams": "4.20",
        "availability": "na_objednavku",
        "badge": "bestseller",
        "is_featured": True,
        "cover_image_url": unsplash("1622398925373-3f91b1e275f5"),
        "description": (
            "Klasická obrúčka so zaobleným komfortným profilom, ktorý sa pohodlne nosí celý život. "
            "Leštený povrch zo žltého 14k zlata, šírka 4 mm. Cena je uvedená za jeden kus – "
            "gravírovanie mien a dátumu je v cene."
        ),
        "gallery": [
            (unsplash("1622398925373-3f91b1e275f5"), "Detail profilu"),
            (unsplash("1515934751635-c81c6bc9a2d8"), "Svadobná inšpirácia"),
        ],
    },
    {
        "sku": "SO-DUO-102",
        "category": "svadobne-obrucky",
        "name": "Obrúčka Duo s diamantom",
        "collection_name": "Kolekcia Večnosť",
        "base_price": "720.00",
        "metal_type": "biele_zlato",
        "gold_purity": "14k (585/1000)",
        "primary_gemstone": "diamant",
        "carat_weight": "0.05",
        "diamond_grade": "H / SI1",
        "weight_grams": "4.60",
        "availability": "na_objednavku",
        "badge": "none",
        "is_featured": False,
        "cover_image_url": unsplash("1627293509201-cd0c780043e6"),
        "description": (
            "Dvojfarebná obrúčka z bieleho a žltého 14k zlata s jemne zapusteným diamantom 0,05 ct. "
            "Pánska verzia sa vyrába bez kameňa v rovnakom dizajne. Cena za kus."
        ),
        "gallery": [
            (unsplash("1627293509201-cd0c780043e6"), "Pár obrúčok"),
            (GIFT_BOX_RINGS, "Darčekové balenie"),
        ],
    },
    {
        "sku": "SO-VIN-103",
        "category": "svadobne-obrucky",
        "name": "Obrúčka Vintage Milgrain",
        "collection_name": "Kolekcia Večnosť",
        "base_price": "840.00",
        "metal_type": "biele_zlato",
        "gold_purity": "18k (750/1000)",
        "primary_gemstone": "bez_kamena",
        "carat_weight": None,
        "diamond_grade": None,
        "weight_grams": "5.30",
        "availability": "skladom",
        "badge": "novinka",
        "is_featured": False,
        "cover_image_url": unsplash("1515934751635-c81c6bc9a2d8"),
        "description": (
            "Obrúčka z 18k bieleho zlata s ručne vyrytým milgrain okrajom – jemnou guľôčkovou "
            "bordúrou inšpirovanou šperkárstvom 20. rokov. Cena za kus, gravírovanie v cene."
        ),
        "gallery": [(unsplash("1515934751635-c81c6bc9a2d8"), "Svadobná inšpirácia")],
    },
    # --- Náhrdelníky ---------------------------------------------------------
    {
        "sku": "NA-PER-201",
        "category": "nahrdelniky",
        "name": "Perlový náhrdelník Grace",
        "collection_name": "Kolekcia Perla",
        "base_price": "890.00",
        "metal_type": "biele_zlato",
        "gold_purity": "14k (585/1000)",
        "primary_gemstone": "perla",
        "carat_weight": None,
        "diamond_grade": "Perly 7–7,5 mm, AAA lesk",
        "weight_grams": "28.50",
        "availability": "skladom",
        "badge": "bestseller",
        "is_featured": True,
        "cover_image_url": unsplash("1515562141207-7a88fb7ce338"),
        "description": (
            "Ručne navliekaný náhrdelník z vybraných sladkovodných perál s vysokým leskom, "
            "s uzlíkom medzi každou perlou. Zapínanie z bieleho 14k zlata s diamantovým akcentom. "
            "Dĺžka 45 cm – klasická „princess“ dĺžka."
        ),
        "gallery": [
            (unsplash("1515562141207-7a88fb7ce338"), "Darčekové balenie"),
            (unsplash("1611085583191-a3b181a88401"), "Na krku"),
        ],
    },
    {
        "sku": "NA-HAL-202",
        "category": "nahrdelniky",
        "name": "Prívesok Halo Cushion",
        "collection_name": "Klasik Solitaire",
        "base_price": "3650.00",
        "metal_type": "biele_zlato",
        "gold_purity": "18k (750/1000)",
        "primary_gemstone": "diamant",
        "carat_weight": "0.80",
        "diamond_grade": "G / VS2, GIA certifikát",
        "weight_grams": "4.10",
        "availability": "skladom",
        "badge": "none",
        "is_featured": False,
        "cover_image_url": unsplash("1598560917505-59a3ad559071"),
        "description": (
            "Okrúhly briliant 0,80 ct v halo ráme tvaru cushion zavesený na jemnej venetiánskej "
            "retiazke z 18k bieleho zlata (42 + 3 cm). Žiarivý šperk, ktorý sa hodí k večernej róbe aj bielej košeli."
        ),
        "gallery": [
            (unsplash("1598560917505-59a3ad559071"), "Detail osadenia kameňa"),
            (unsplash("1588444968576-f8fe92ce56fd"), "Celá retiazka"),
            (ON_NECK_DELICATE, "Na krku"),
        ],
    },
    {
        "sku": "NA-VER-203",
        "category": "nahrdelniky",
        "name": "Smaragdový prívesok Verde",
        "collection_name": "Kolekcia Aura",
        "base_price": "2980.00",
        "metal_type": "zlte_zlato",
        "gold_purity": "18k (750/1000)",
        "primary_gemstone": "smaragd",
        "carat_weight": "1.10",
        "diamond_grade": "Kolumbijský smaragd, minor oil, certifikát GRS",
        "weight_grams": "5.40",
        "availability": "skladom",
        "badge": "limitovana_edicia",
        "is_featured": True,
        "cover_image_url": unsplash("1599643477877-530eb83abc8e"),
        "description": (
            "Hlboko zelený kolumbijský smaragd v osemhrannom brúse, osadený v ručne kovanom "
            "rámčeku z 18k žltého zlata. Prívesok visí na pevnej ankrovej retiazke dĺžky 45 cm."
        ),
        "gallery": [
            (unsplash("1599643477877-530eb83abc8e"), "Detail osadenia kameňa"),
            (unsplash("1599643478518-a784e5dc4c8f"), "Celá retiazka"),
        ],
    },
    {
        "sku": "NA-LUN-204",
        "category": "nahrdelniky",
        "name": "Retiazka s perlou Luna",
        "collection_name": "Kolekcia Perla",
        "base_price": "390.00",
        "metal_type": "zlte_zlato",
        "gold_purity": "14k (585/1000)",
        "primary_gemstone": "perla",
        "carat_weight": None,
        "diamond_grade": "Perla 8 mm, kvapkovitý tvar",
        "weight_grams": "2.10",
        "availability": "skladom",
        "badge": "novinka",
        "is_featured": False,
        "cover_image_url": unsplash("1611085583191-a3b181a88401"),
        "description": (
            "Minimalistická retiazka zo žltého 14k zlata s jedinou kvapkovitou perlou. "
            "Ideálny darček k narodeninám či promócii – dodávame v luxusnej darčekovej krabičke."
        ),
        "gallery": [
            (unsplash("1611085583191-a3b181a88401"), "Na krku"),
            (ON_NECK_LAYERED, "Kombinácia s ďalšími retiazkami"),
        ],
    },
    # --- Náušnice ------------------------------------------------------------
    {
        "sku": "NU-ZAF-301",
        "category": "nausnice",
        "name": "Náušnice Zafírová kvapka",
        "collection_name": "Kolekcia Aura",
        "base_price": "4950.00",
        "metal_type": "biele_zlato",
        "gold_purity": "18k (750/1000)",
        "primary_gemstone": "zafir",
        "carat_weight": "2.40",
        "diamond_grade": "Modrý zafír (2 × 1,20 ct) + diamanty 0,85 ct G / VS",
        "weight_grams": "7.80",
        "availability": "skladom",
        "badge": "limitovana_edicia",
        "is_featured": True,
        "cover_image_url": unsplash("1535632066927-ab7c9ab60908"),
        "description": (
            "Visiace náušnice s kvapkovitými kráľovsky modrými zafírmi, lemovanými bagetovými "
            "a okrúhlymi diamantmi. Spoločenský šperk s art deco charakterom, ktorý zažiari "
            "na plese, svadbe aj v opere."
        ),
        "gallery": [
            (unsplash("1535632066927-ab7c9ab60908"), "Detail osadenia kameňa"),
            (ON_EAR, "Na uchu"),
        ],
    },
    {
        "sku": "NU-HAL-302",
        "category": "nausnice",
        "name": "Diamantové puzetky Halo",
        "collection_name": "Klasik Solitaire",
        "base_price": "1690.00",
        "metal_type": "biele_zlato",
        "gold_purity": "14k (585/1000)",
        "primary_gemstone": "diamant",
        "carat_weight": "0.60",
        "diamond_grade": "G / SI1, 2 × 0,30 ct",
        "weight_grams": "2.40",
        "availability": "skladom",
        "badge": "bestseller",
        "is_featured": False,
        "cover_image_url": unsplash("1588444650733-d0767b753fc8"),
        "description": (
            "Puzetky so stredovými briliantmi 2 × 0,30 ct v halo ráme. Bezpečné skrutkovacie "
            "zapínanie, ktoré drží náušnicu pevne aj pri celodennom nosení."
        ),
        "gallery": [
            (unsplash("1588444650733-d0767b753fc8"), "Detail osadenia kameňa"),
            (unsplash("1626784215021-2e39ccf971cd"), "Variant v žltom zlate"),
        ],
    },
    {
        "sku": "NU-TOR-303",
        "category": "nausnice",
        "name": "Kruhové náušnice Torsade",
        "collection_name": "Kolekcia Atelier",
        "base_price": "520.00",
        "metal_type": "zlte_zlato",
        "gold_purity": "14k (585/1000)",
        "primary_gemstone": "bez_kamena",
        "carat_weight": None,
        "diamond_grade": None,
        "weight_grams": "3.90",
        "availability": "skladom",
        "badge": "novinka",
        "is_featured": False,
        "cover_image_url": unsplash("1617038260897-41a1f14a8ca0"),
        "description": (
            "Ručne točené kruhové náušnice z dutého 14k zlata – ľahké, výrazné a príjemné na nosenie. "
            "Priemer 18 mm, klapkové zapínanie."
        ),
        "gallery": [
            (unsplash("1617038260897-41a1f14a8ca0"), "Detail textúry"),
            (unsplash("1617038220319-276d3cfab638"), "Pár náušníc"),
            (unsplash("1608508644127-ba99d7732fee"), "Darčekové balenie"),
        ],
    },
    # --- Náramky -------------------------------------------------------------
    {
        "sku": "NR-RIV-401",
        "category": "naramky",
        "name": "Tenisový náramok Riviera",
        "collection_name": "Klasik Solitaire",
        "base_price": "7900.00",
        "metal_type": "biele_zlato",
        "gold_purity": "18k (750/1000)",
        "primary_gemstone": "diamant",
        "carat_weight": "3.00",
        "diamond_grade": "G / VS2, 48 briliantov, certifikát HRD",
        "weight_grams": "12.60",
        "availability": "skladom",
        "badge": "bestseller",
        "is_featured": True,
        "cover_image_url": unsplash("1619119069152-a2b331eb392a"),
        "description": (
            "Ikonický tenisový náramok so 48 okrúhlymi briliantmi s celkovou hmotnosťou 3,00 ct, "
            "osadenými v štvorkolíkových kotlíkoch z 18k bieleho zlata. Dvojitá bezpečnostná "
            "poistka zapínania, dĺžka 17,5 cm (na požiadanie upravíme)."
        ),
        "gallery": [
            (unsplash("1619119069152-a2b331eb392a"), "Detail osadenia kameňa"),
            (unsplash("1573408301185-9146fe634ad0"), "Večerná inšpirácia"),
        ],
    },
    {
        "sku": "NR-ROS-402",
        "category": "naramky",
        "name": "Náramok Rosé Infinity",
        "collection_name": "Kolekcia Lumière",
        "base_price": "2290.00",
        "metal_type": "ruzove_zlato",
        "gold_purity": "14k (585/1000)",
        "primary_gemstone": "lab_diamant",
        "carat_weight": "1.20",
        "diamond_grade": "F / VS1, IGI certifikát",
        "weight_grams": "9.80",
        "availability": "na_objednavku",
        "badge": "none",
        "is_featured": False,
        "cover_image_url": unsplash("1611591437281-460bfbe1220a"),
        "description": (
            "Prepletené články v tvare nekonečna z ružového 14k zlata, posiate lab-grown diamantmi "
            "s celkovou hmotnosťou 1,20 ct. Vyrábame na mieru podľa obvodu zápästia."
        ),
        "gallery": [(unsplash("1611591437281-460bfbe1220a"), "Detail článkov")],
    },
    {
        "sku": "NR-ATL-403",
        "category": "naramky",
        "name": "Retiazkový náramok Atelier",
        "collection_name": "Kolekcia Atelier",
        "base_price": "1190.00",
        "metal_type": "zlte_zlato",
        "gold_purity": "14k (585/1000)",
        "primary_gemstone": "bez_kamena",
        "carat_weight": None,
        "diamond_grade": None,
        "weight_grams": "11.50",
        "availability": "vypredane",
        "badge": "none",
        "is_featured": False,
        "cover_image_url": unsplash("1602173574767-37ac01994b2a"),
        "description": (
            "Masívne oválne články zo žltého 14k zlata s karabínkovým zapínaním. Výrazný, no "
            "nadčasový náramok, ktorý krásne vynikne samostatne aj v kombinácii s hodinkami."
        ),
        "gallery": [
            (unsplash("1602173574767-37ac01994b2a"), "Detail článkov"),
            (unsplash("1611107683227-e9060eccd846"), "Kolekcia Atelier"),
        ],
    },
    # --- Investičné zlato ----------------------------------------------------
    {
        "sku": "IZ-BAR-010",
        "category": "investicne-zlato",
        "name": "Investičná zlatá tehlička 10 g",
        "collection_name": "Investičné zlato LBMA",
        "base_price": "1245.00",
        "metal_type": "zlte_zlato",
        "gold_purity": "24k (999,9/1000)",
        "primary_gemstone": "bez_kamena",
        "carat_weight": None,
        "diamond_grade": None,
        "weight_grams": "10.00",
        "availability": "skladom",
        "badge": "none",
        "is_featured": False,
        "cover_image_url": unsplash("1610375461246-83df859d849d"),
        "description": (
            "Razená zlatá tehlička rýdzosti 999,9/1000 od švajčiarskej rafinérie s akreditáciou LBMA, "
            "v zatavenom blistri s certifikátom a sériovým číslom. Investičné zlato je v SR oslobodené "
            "od DPH. Cena sa denne aktualizuje podľa burzy – uvedená cena je orientačná."
        ),
        "gallery": [(unsplash("1610375461246-83df859d849d"), "Tehličky v blistri")],
    },
    {
        "sku": "IZ-BAR-311",
        "category": "investicne-zlato",
        "name": "Investičná zlatá tehlička 1 oz (31,1 g)",
        "collection_name": "Investičné zlato LBMA",
        "base_price": "3790.00",
        "metal_type": "zlte_zlato",
        "gold_purity": "24k (999,9/1000)",
        "primary_gemstone": "bez_kamena",
        "carat_weight": None,
        "diamond_grade": None,
        "weight_grams": "31.10",
        "availability": "skladom",
        "badge": "bestseller",
        "is_featured": False,
        "cover_image_url": unsplash("1610375461369-d613b564f4c4"),
        "description": (
            "Jedna trójska unca rýdzeho zlata – najlikvidnejšia investičná veľkosť na svete. "
            "Certifikát LBMA, sériové číslo, oslobodené od DPH. Orientačná cena podľa aktuálnej burzy."
        ),
        "gallery": [(unsplash("1610375461369-d613b564f4c4"), "Detail razby")],
    },
    {
        "sku": "IZ-COIN-WPH",
        "category": "investicne-zlato",
        "name": "Zlatá minca Wiener Philharmoniker 1 oz",
        "collection_name": "Investičné mince",
        "base_price": "3830.00",
        "metal_type": "zlte_zlato",
        "gold_purity": "24k (999,9/1000)",
        "primary_gemstone": "bez_kamena",
        "carat_weight": None,
        "diamond_grade": None,
        "weight_grams": "31.10",
        "availability": "na_objednavku",
        "badge": "none",
        "is_featured": False,
        "cover_image_url": unsplash("1624365169364-0640dd10e180"),
        "description": (
            "Najpredávanejšia investičná minca v Európe, razená Rakúskou mincovňou. Zlato 999,9/1000, "
            "priemer 37 mm. Dodanie do 5 pracovných dní, oslobodené od DPH."
        ),
        "gallery": [(unsplash("1624365169364-0640dd10e180"), "Mince a tehličky")],
    },
]


class Command(BaseCommand):
    help = "Naplní databázu ukážkovými kategóriami a šperkami (idempotentne)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--flush",
            action="store_true",
            help="Pred naplnením vymaže všetky šperky, fotografie a kategórie.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if options["flush"]:
            JewelryImage.objects.all().delete()
            JewelryItem.objects.all().delete()
            Category.objects.all().delete()
            self.stdout.write(self.style.WARNING("Katalóg bol vymazaný."))

        categories = {}
        for order, data in enumerate(CATEGORIES, start=1):
            category, _ = Category.objects.update_or_create(
                slug=data["slug"],
                defaults={**data, "display_order": order},
            )
            categories[category.slug] = category

        created_count = 0
        for raw in ITEMS:
            data = dict(raw)
            sku = data.pop("sku")
            gallery = data.pop("gallery")
            data["category"] = categories[data.pop("category")]
            for field in ("base_price", "carat_weight", "weight_grams"):
                if data.get(field) is not None:
                    data[field] = Decimal(data[field])

            item, created = JewelryItem.objects.update_or_create(sku=sku, defaults=data)
            created_count += int(created)

            item.images.all().delete()
            JewelryImage.objects.bulk_create(
                JewelryImage(item=item, image_url=url, caption=caption, display_order=index)
                for index, (url, caption) in enumerate(gallery)
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"Hotovo: {len(categories)} kategórií, {len(ITEMS)} šperkov "
                f"({created_count} nových, {len(ITEMS) - created_count} aktualizovaných)."
            )
        )
