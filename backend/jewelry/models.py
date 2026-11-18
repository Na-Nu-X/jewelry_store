"""Domain models for the jewelry store & goldsmith atelier."""

from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import models
from django.utils.text import slugify


def unique_slugify(instance: models.Model, value: str, slug_field: str = "slug") -> str:
    """Generate a slug from `value` that is unique for the instance's model."""
    base = slugify(value)[:200] or "polozka"
    slug = base
    model = type(instance)
    counter = 2
    while model.objects.filter(**{slug_field: slug}).exclude(pk=instance.pk).exists():
        slug = f"{base}-{counter}"
        counter += 1
    return slug


class TimestampedModel(models.Model):
    created_at = models.DateTimeField("Vytvorené", auto_now_add=True)

    class Meta:
        abstract = True


# --- Choices -----------------------------------------------------------------


class MetalType(models.TextChoices):
    YELLOW_GOLD = "zlte_zlato", "Žlté zlato"
    WHITE_GOLD = "biele_zlato", "Biele zlato"
    ROSE_GOLD = "ruzove_zlato", "Ružové zlato"
    PLATINUM = "platina", "Platina 950"
    SILVER = "striebro", "Striebro 925"


class Gemstone(models.TextChoices):
    DIAMOND = "diamant", "Prírodný diamant"
    LAB_DIAMOND = "lab_diamant", "Lab-grown diamant"
    SAPPHIRE = "zafir", "Zafír"
    EMERALD = "smaragd", "Smaragd"
    RUBY = "rubin", "Rubín"
    PEARL = "perla", "Sladkovodná perla"
    NONE = "bez_kamena", "Bez kameňa"


class Availability(models.TextChoices):
    IN_STOCK = "skladom", "Skladom v predajni"
    MADE_TO_ORDER = "na_objednavku", "Výroba na mieru 2–3 týždne"
    SOLD_OUT = "vypredane", "Vypredané"


class Badge(models.TextChoices):
    BESTSELLER = "bestseller", "Bestseller"
    NEW = "novinka", "Novinka"
    LIMITED = "limitovana_edicia", "Limitovaná edícia"
    NONE = "none", "Bez štítku"


# --- Catalog -----------------------------------------------------------------


class Category(models.Model):
    name = models.CharField("Názov", max_length=120, unique=True)
    slug = models.SlugField("URL identifikátor", max_length=140, unique=True, blank=True)
    description = models.TextField("Popis", blank=True)
    cover_image_url = models.URLField("Titulný obrázok (URL)", max_length=500, blank=True)
    display_order = models.PositiveIntegerField("Poradie zobrazenia", default=0)

    class Meta:
        verbose_name = "Kategória"
        verbose_name_plural = "Kategórie"
        ordering = ["display_order", "name"]

    def __str__(self) -> str:
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = unique_slugify(self, self.name)
        super().save(*args, **kwargs)


class JewelryItem(TimestampedModel):
    category = models.ForeignKey(
        Category,
        verbose_name="Kategória",
        on_delete=models.PROTECT,
        related_name="items",
    )
    name = models.CharField("Názov šperku", max_length=200)
    collection_name = models.CharField("Kolekcia", max_length=120, blank=True)
    sku = models.CharField("Kód (SKU)", max_length=40, unique=True)
    slug = models.SlugField("URL identifikátor", max_length=220, unique=True, blank=True)
    base_price = models.DecimalField(
        "Cena (EUR)",
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0"))],
    )
    metal_type = models.CharField("Kov", max_length=20, choices=MetalType.choices)
    gold_purity = models.CharField(
        "Rýdzosť", max_length=40, help_text="Napr. 14k (585/1000), 18k (750/1000), 950/1000"
    )
    primary_gemstone = models.CharField(
        "Hlavný kameň", max_length=20, choices=Gemstone.choices, default=Gemstone.NONE
    )
    carat_weight = models.DecimalField(
        "Karáty (ct)", max_digits=6, decimal_places=2, null=True, blank=True
    )
    diamond_grade = models.CharField(
        "Farba / čistota / certifikát",
        max_length=120,
        blank=True,
        null=True,
        help_text="Napr. G / VS1, GIA certifikát",
    )
    weight_grams = models.DecimalField(
        "Hmotnosť (g)", max_digits=8, decimal_places=2, validators=[MinValueValidator(Decimal("0"))]
    )
    availability = models.CharField(
        "Dostupnosť", max_length=20, choices=Availability.choices, default=Availability.IN_STOCK
    )
    badge = models.CharField("Štítok", max_length=20, choices=Badge.choices, default=Badge.NONE)
    description = models.TextField("Popis", blank=True)
    cover_image_url = models.URLField("Titulný obrázok (URL)", max_length=500)
    is_featured = models.BooleanField("Vybraný klenot (na úvodnej stránke)", default=False)

    class Meta:
        verbose_name = "Šperk"
        verbose_name_plural = "Šperky"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["metal_type"]),
            models.Index(fields=["primary_gemstone"]),
            models.Index(fields=["availability"]),
            models.Index(fields=["base_price"]),
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.sku})"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = unique_slugify(self, self.name)
        super().save(*args, **kwargs)

    @property
    def is_ring(self) -> bool:
        return "prste" in self.category.slug or "obruc" in self.category.slug


class JewelryImage(models.Model):
    item = models.ForeignKey(
        JewelryItem, verbose_name="Šperk", on_delete=models.CASCADE, related_name="images"
    )
    image_url = models.URLField("Obrázok (URL)", max_length=500)
    caption = models.CharField("Popis obrázka", max_length=160, blank=True)
    display_order = models.PositiveIntegerField("Poradie", default=0)

    class Meta:
        verbose_name = "Fotografia šperku"
        verbose_name_plural = "Galéria fotografií"
        ordering = ["display_order", "id"]

    def __str__(self) -> str:
        return self.caption or self.image_url


# --- Customer requests -------------------------------------------------------


class OrderOrReservation(TimestampedModel):
    class OrderType(models.TextChoices):
        ESHOP = "eshop_objednavka", "Online objednávka"
        STORE = "rezervacia_predajna", "Rezervácia na osobný odber v predajni"

    class Status(models.TextChoices):
        NEW = "nova", "Nová"
        PROCESSING = "spracovava_sa", "Spracováva sa"
        DONE = "dokoncena", "Dokončená"

    order_type = models.CharField("Typ", max_length=30, choices=OrderType.choices)
    items = models.JSONField(
        "Položky",
        default=list,
        help_text="Zoznam položiek: slug, názov, množstvo, veľkosť prsteňa, gravírovanie, cena.",
    )
    total_price = models.DecimalField("Celková cena (EUR)", max_digits=10, decimal_places=2)
    client_name = models.CharField("Meno a priezvisko", max_length=160)
    email = models.EmailField("E-mail")
    phone = models.CharField("Telefón", max_length=40)
    delivery_address = models.TextField("Doručovacia adresa", blank=True)
    note = models.TextField("Poznámka", blank=True)
    status = models.CharField("Stav", max_length=20, choices=Status.choices, default=Status.NEW)

    class Meta:
        verbose_name = "Objednávka / rezervácia"
        verbose_name_plural = "Objednávky a rezervácie"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"#{self.pk} – {self.client_name} ({self.get_order_type_display()})"


class BespokeRequest(TimestampedModel):
    class JewelryType(models.TextChoices):
        ENGAGEMENT_RING = "zasnubny_prsten", "Zásnubný prsteň"
        WEDDING_BANDS = "svadobne_obrucky", "Svadobné obrúčky"
        PENDANT_EARRINGS = "privesok_nausnice", "Prívesok / Náušnice"
        OTHER = "iny_sperk", "Iný šperk"

    jewelry_type = models.CharField("Typ šperku", max_length=30, choices=JewelryType.choices)
    preferred_metal = models.CharField(
        "Preferovaný kov", max_length=20, choices=MetalType.choices, blank=True
    )
    gemstone_preference = models.CharField(
        "Preferovaný kameň", max_length=20, choices=Gemstone.choices, blank=True
    )
    ring_sizes = models.CharField("Veľkosti prsteňov", max_length=60, blank=True)
    engraving_text = models.CharField("Text gravírovania", max_length=120, blank=True)
    estimated_budget = models.CharField("Orientačný rozpočet", max_length=60)
    description = models.TextField("Popis predstavy")
    client_name = models.CharField("Meno a priezvisko", max_length=160)
    phone = models.CharField("Telefón", max_length=40)
    email = models.EmailField("E-mail")
    is_reviewed = models.BooleanField("Posúdené", default=False)

    class Meta:
        verbose_name = "Šperk na mieru"
        verbose_name_plural = "Šperky na mieru – dopyty"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.get_jewelry_type_display()} – {self.client_name}"


class ServiceInquiry(TimestampedModel):
    class ServiceType(models.TextChoices):
        GOLD_BUYBACK = "vykup_zlata", "Výkup zlomkového zlata"
        REPAIR = "oprava_uprava", "Oprava alebo úprava veľkosti"
        CLEANING = "cistenie_rhodiovanie", "Čistenie a rhodiovanie"

    service_type = models.CharField("Služba", max_length=30, choices=ServiceType.choices)
    estimated_weight_grams = models.DecimalField(
        "Odhadovaná hmotnosť (g)",
        max_digits=8,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal("0"))],
    )
    note = models.TextField("Poznámka", blank=True)
    client_name = models.CharField("Meno a priezvisko", max_length=160)
    phone = models.CharField("Telefón", max_length=40)
    email = models.EmailField("E-mail")
    is_resolved = models.BooleanField("Vybavené", default=False)

    class Meta:
        verbose_name = "Výkup / servis – dopyt"
        verbose_name_plural = "Výkup zlata a servis – dopyty"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.get_service_type_display()} – {self.client_name}"


class ContactMessage(TimestampedModel):
    """Consultation request from the atelier / contact page."""

    class Topic(models.TextChoices):
        CONSULTATION = "konzultacia", "Osobná konzultácia v ateliéri"
        QUESTION = "otazka", "Otázka k šperku"
        OTHER = "ine", "Iné"

    topic = models.CharField("Téma", max_length=20, choices=Topic.choices, default=Topic.CONSULTATION)
    preferred_date = models.DateField("Preferovaný termín", null=True, blank=True)
    message = models.TextField("Správa")
    client_name = models.CharField("Meno a priezvisko", max_length=160)
    phone = models.CharField("Telefón", max_length=40, blank=True)
    email = models.EmailField("E-mail")
    is_resolved = models.BooleanField("Vybavené", default=False)

    class Meta:
        verbose_name = "Správa z kontaktného formulára"
        verbose_name_plural = "Kontaktné správy a konzultácie"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.get_topic_display()} – {self.client_name}"
