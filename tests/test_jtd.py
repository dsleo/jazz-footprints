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
