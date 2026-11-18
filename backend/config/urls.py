from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

admin.site.site_header = "Ateliér – správa klenotov"
admin.site.site_title = "Administrácia ateliéru"
admin.site.index_title = "Správa obchodu a zákaziek"

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("jewelry.urls")),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
