# Footprints

Find the same phrase in different jazz solos, hear both, and see the notes line up.

**Live: <https://dsleo.github.io/jazz-footprints/>**

The archive covers 1,558 transcribed solos (456 horn solos from the [Weimar Jazz Database](https://jazzomat.hfm-weimar.de/download/download.html), 1,102 piano-trio solos from the [Jazz Trio Database](https://github.com/HuwCheston/Jazz-Trio-Database)) and about 323,000 matching passages. Everything is precomputed, so the site is plain static files.

- **Crate:** browse matching pairs, filter by decade, instrument or musician.
- **Pair view:** score excerpts, MIDI playback and links to the recordings.
- **Echoes:** a timeline of musicians and their strongest connections.
- **Listen & Find:** record or upload a line and search the horn solos, all in the browser.
- **[Who echoes whom](static/stats.html):** a short tour of whose phrases come back most.

A match means similar notes, not proof of borrowing.

## Run it

```sh
python3 -m http.server 8766 -d static    # then open http://127.0.0.1:8766
```

It needs a server; opening the files directly does not work.

## Rebuild the data

```sh
python3 -m jazzmine download                  # WJazzD -> data/wjazzd.db
python3 -m jazzmine sync-jazztube             # recording links
python3 -m jazzmine import-jtd-pilot JTD.zip --limit 1294
python3 -m jazzmine.video_audit               # drop unavailable videos
python3 -m jazzmine.artwork                   # album covers
python3 -m jazzmine.joint_store               # search, about a minute
python3 -m jazzmine.static_export             # -> static/catalog/
python3 -m jazzmine.quotation_stats           # -> static/stats.json
npm ci && npm run build:listen                # local pitch model
python3 -m jazzmine.listen_export             # -> static/catalog/listen/
```

`data/*.db` stays local; `static/catalog/` is the committed output. Pushing to `main` runs the tests and publishes `static/` to GitHub Pages.

## Test

```sh
python3 -m pytest -q tests/listen tests/test_joint_search.py tests/test_static_export.py tests/test_dtl_export.py
npm run test:listen:unit
npx playwright test
```

## More

- [How matching works](docs/search.md) and [the similarity threshold](docs/threshold.md)
- [Hosting notes](docs/hosting.md)
- [Listen & Find](docs/listen/MODEL_SPIKE.md): model choice and [browser checklist](docs/listen/BROWSER_CHECKLIST.md)
- [Data notes](docs/data/jtd-pilot.md) and [DTL1000 status](docs/data/dtl-status.md), [asset rights](docs/asset-rights.md), [Reddit launch kit](docs/reddit-launch.md)

Data is licensed under ODbL 1.0 ([details](static/DATA_LICENSE.txt)). Score rendering uses [abcjs](static/vendor/abcjs-LICENSE.md) (MIT).
