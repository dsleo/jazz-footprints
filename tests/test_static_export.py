from __future__ import annotations

import unittest
from types import SimpleNamespace

from jazzmine.static_export import excluded_pairs, jtd_unplayable, recording


SOLO = SimpleNamespace(
    melid=42, trackid=7, solo_start=20.0, source="WJazzD",
    onsets=[0.0, 10.0, 20.0], durations=[1.0, 1.0, 1.0],
)


class RecordingExportTests(unittest.TestCase):
    def test_jazztube_uses_published_solo_bounds_at_passage_onset(self):
        aligned = {"42": {"video_id": "abc12345678", "solo_start_sec": 100.0,
                          "solo_end_sec": 121.0}}
        self.assertEqual(recording(SOLO, 30.0, {}, aligned, {}),
                         {"video_id": "abc12345678", "second": 110, "kind": "aligned"})

    def test_verified_track_mapping_takes_priority(self):
        manual = {"7": {"video_id": "verified123", "performance_verified": 1,
                        "speed_ratio": 1.1, "offset_seconds": 40}}
        aligned = {"42": {"video_id": "abc12345678", "solo_start_sec": 100,
                          "solo_end_sec": 121}}
        self.assertEqual(recording(SOLO, 30, manual, aligned, {})["second"], 73)

    def test_unverified_manual_link_has_no_guessed_timestamp(self):
        manual = {"7": {"video_id": "candidate12", "performance_verified": 0}}
        self.assertEqual(recording(SOLO, 30, manual, {}, {})["second"], None)

    def test_likely_video_uses_source_track_time_only_within_duration(self):
        auto = {"7": {"video_id": "likely12345", "video_duration": 60}}
        self.assertEqual(recording(SOLO, 30, {}, {}, auto)["second"], 30)
        self.assertIsNone(recording(SOLO, 60, {}, {}, auto))


if __name__ == "__main__":
    unittest.main()


class JtdRecordingTests(unittest.TestCase):
    def test_jtd_links_at_published_solo_start_plus_onset(self):
        solo = SimpleNamespace(source="JTD", solo_start=64.0, trackid=1, melid=1,
                               source_url="https://www.youtube.com/watch?v=XE1wjT92yfs")
        self.assertEqual(recording(solo, 74.9, {}, {}, {}),
                         {"video_id": "XE1wjT92yfs", "second": 74, "kind": "verified"})

    def test_jtd_without_youtube_link_has_no_recording(self):
        solo = SimpleNamespace(source="JTD", solo_start=0, trackid=1, melid=1,
                               source_url="https://github.com/HuwCheston/Jazz-Trio-Database")
        self.assertIsNone(recording(solo, 10, {}, {}, {}))


class JtdPlayabilityTests(unittest.TestCase):
    JTD = SimpleNamespace(source="JTD")

    def test_unavailable_or_too_short_video_is_unplayable(self):
        link = {"video_id": "abc12345678", "second": 4950}
        self.assertTrue(jtd_unplayable(self.JTD, link, {"abc12345678"}, {}))
        self.assertTrue(jtd_unplayable(self.JTD, link, set(), {"abc12345678": 200}))
        self.assertTrue(jtd_unplayable(self.JTD, None, set(), {}))

    def test_playable_jtd_and_other_sources_are_kept(self):
        link = {"video_id": "abc12345678", "second": 100}
        self.assertFalse(jtd_unplayable(self.JTD, link, set(), {"abc12345678": 200}))
        self.assertFalse(jtd_unplayable(SimpleNamespace(source="WJazzD"), None, set(), {}))

    def test_exclusion_matches_either_orientation(self):
        import json, tempfile
        from pathlib import Path
        with tempfile.TemporaryDirectory() as d:
            path = Path(d) / "x.json"
            path.write_text(json.dumps([{"pair": "1.2.3.4", "reason": "x"}]))
            keys = excluded_pairs(path)
        self.assertEqual(keys, {(1, 2, 3, 4), (3, 4, 1, 2)})
