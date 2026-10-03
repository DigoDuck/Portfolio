import os
from collections.abc import Mapping

from django.core.exceptions import ImproperlyConfigured

# Credenciais do Railway Bucket (aba Credentials do bucket, ver DEC-004).
MEDIA_ENV = (
    "AWS_ENDPOINT_URL",
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "AWS_S3_BUCKET_NAME",
    "AWS_DEFAULT_REGION",
)


def build_media_storage(debug: bool, env: Mapping[str, str] = os.environ) -> dict:
    """Storage de mídia: disco local em desenvolvimento, bucket S3 em produção.

    Em produção não existe fallback para o disco: o do Render é efêmero, e um
    upload ali some no próximo deploy (foi o que apagou a foto do perfil). Sem
    credencial, a inicialização falha dizendo quais variáveis faltam, nunca
    os valores.
    """
    if debug:
        return {"BACKEND": "django.core.files.storage.FileSystemStorage"}

    missing = [name for name in MEDIA_ENV if not env.get(name, "").strip()]
    if missing:
        raise ImproperlyConfigured(
            "Mídia em produção precisa do bucket S3. Variáveis ausentes: "
            + ", ".join(missing)
            + "."
        )

    return {
        "BACKEND": "storages.backends.s3.S3Storage",
        "OPTIONS": {
            "bucket_name": env["AWS_S3_BUCKET_NAME"],
            "endpoint_url": env["AWS_ENDPOINT_URL"],
            "access_key": env["AWS_ACCESS_KEY_ID"],
            "secret_key": env["AWS_SECRET_ACCESS_KEY"],
            "region_name": env["AWS_DEFAULT_REGION"],
            # Railway Buckets: privados e com endereçamento virtual-hosted.
            "addressing_style": "virtual",
            "signature_version": "s3v4",
            "querystring_auth": True,
            "querystring_expire": 3600,
            "default_acl": None,
            # Dois uploads com o mesmo nome não se sobrescrevem.
            "file_overwrite": False,
        },
    }
