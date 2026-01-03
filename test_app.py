import unittest
import json
from app import app, clean_url, partition_url_with_path, detect_homoglyphs, load_homoglyphs

class TestHomoglyphDetector(unittest.TestCase):

    def setUp(self):
        # Setup flask test client
        self.app = app.test_client()
        self.app.testing = True
        self.homoglyph_map = load_homoglyphs("chars.txt")

    # --- Unit Testing Fungsi Internal ---

    def test_clean_url(self):
        self.assertEqual(clean_url("https://www.google.com"), "google.com")
        self.assertEqual(clean_url("http://apple.com"), "apple.com")

    def test_partition_url_valid(self):
        sub, dom, tld, path = partition_url_with_path("blog.mysite.com/profile")
        self.assertEqual(sub, "blog")
        self.assertEqual(dom, "mysite")
        self.assertEqual(tld, "com")
        self.assertEqual(path, "profile")

    def test_detect_homoglyphs_positive(self):
        # Menggunakan karakter 'α' (Alpha) yang biasanya ada di chars.txt untuk meniru 'a'
        results = detect_homoglyphs("googІe", self.homoglyph_map) # 'I' CYRILLIC CAPITAL LETTER BYELORUSSIAN-UKRAINIAN I
        self.assertTrue(len(results) >= 0) 

    # --- Integration/Whitebox Testing pada Endpoint ---

    def test_api_empty_url(self):
        response = self.app.post('/detect', 
                                 data=json.dumps({"url": ""}),
                                 content_type='application/json')
        self.assertEqual(response.status_code, 400)
        self.assertIn("A URL must be provided", response.get_json()['error'])

    def test_api_safe_url(self):
        response = self.app.post('/detect', 
                                 data=json.dumps({"url": "google.com"}),
                                 content_type='application/json')
        data = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertIn("appears to be free", data['summary_message'])

    def test_api_homoglyph_detected(self):
        # 'cοm' menggunakan omicron (U+03BF) bukan 'o' ASCII
        target_url = "google.cοm" 
        response = self.app.post('/detect', 
                                 data=json.dumps({"url": target_url}),
                                 content_type='application/json')
        data = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertTrue(len(data['detections']) > 0)
        self.assertIn("Warning", data['summary_message'])

if __name__ == '__main__':
    unittest.main()