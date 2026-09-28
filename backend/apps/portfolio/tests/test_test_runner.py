import os

from django.conf import settings
from django.test import SimpleTestCase
from django.test.utils import get_runner


class TestRunnerDiscoveryTests(SimpleTestCase):
    def test_discovers_tests_even_when_run_from_repository_root(self):
        # `python backend/manage.py test` rodado da raiz encontrava 0 testes e
        # saía com sucesso: sem rótulo, o DiscoverRunner procura a partir do cwd.
        runner = get_runner(settings)(verbosity=0)
        cwd = os.getcwd()
        os.chdir(settings.BASE_DIR.parent)
        try:
            suite = runner.build_suite([])
        finally:
            os.chdir(cwd)

        self.assertGreater(suite.countTestCases(), 0)
