from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("categories", views.CategoryViewSet, basename="category")
router.register("jewelry", views.JewelryItemViewSet, basename="jewelry")
router.register("orders", views.OrderViewSet, basename="order")
router.register("bespoke", views.BespokeRequestViewSet, basename="bespoke")
router.register("services", views.ServiceInquiryViewSet, basename="service")
router.register("contact", views.ContactMessageViewSet, basename="contact")

urlpatterns = router.urls
