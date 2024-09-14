"""ft_transcendence URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/2.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import include, path, re_path
from django.views.generic import TemplateView
from django.conf import settings
from django.contrib.staticfiles import views
from django.conf.urls.static import static

urlpatterns = []

# If we are developing we want the static files change to be updated as soon as possible
if settings.DEBUG:
    urlpatterns += [
        re_path(r"^static/(?P<path>.*)$", views.serve),
    ]

urlpatterns += [
    path("api/pong/", include("pong.urls")),
    path("admin/", admin.site.urls),
    re_path(r"^.*$", TemplateView.as_view(template_name="index.html"), name="index"),
]
