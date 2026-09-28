from django.conf import settings
from django.test.runner import DiscoverRunner


class BackendDiscoverRunner(DiscoverRunner):
    """Sem rótulo, descobre a partir de backend/ em vez do cwd.

    O DiscoverRunner padrão usa "." quando nenhum rótulo é passado, então
    `python backend/manage.py test` rodado da raiz do repositório encontrava
    0 testes e terminava com sucesso.
    """

    def build_suite(self, test_labels=None, **kwargs):
        return super().build_suite(test_labels or [str(settings.BASE_DIR)], **kwargs)
