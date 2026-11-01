import unittest

from jazzmine.jtd import _beat_position


class BeatPositionTests(unittest.TestCase):
    def test_interpolates_inside_the_beat_grid(self):
        beats = [0.0, 0.5, 1.0, 1.5]
        self.assertAlmostEqual(_beat_position(0.75, beats, 120), 1.5)

    def test_before_first_beat_falls_back_to_tempo(self):
        self.assertAlmostEqual(_beat_position(0.25, [1.0, 1.5], 120), 0.5)


if __name__ == "__main__":
    unittest.main()


class TuneTitleTests(unittest.TestCase):
    def test_other_takes_share_the_tune(self):
        from jazzmine.corpus import tune_title
        for title in ("Trio alternate", "Trio alternate take 2", "Trio take 3", "Trio"):
            self.assertEqual(tune_title(title), "trio")

    def test_real_titles_are_untouched(self):
        from jazzmine.corpus import tune_title
        self.assertEqual(tune_title("Alternate Route"), "alternate route")
        self.assertEqual(tune_title("Take the A Train"), "take the a train")
