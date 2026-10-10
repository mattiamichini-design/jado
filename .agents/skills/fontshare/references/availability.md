# Availability, downloads, and licenses

Inspected October 1, 2026. Endpoints observed in the official Fontshare client can change; they are not a documented API contract.

## Local and canvas fonts

Apps reading system fonts need active OTF/TTF files. Web pages need loaded webfonts; FontBase activation is unnecessary. A cloud canvas may have its own library: verify whether it reads local fonts and whether the font is available in the document. Download, local activation, and rendering are distinct states.

[FontBase](https://fontba.se/) supports activation without permanent installation. Add the collection's `Desktop/Static` directory as a **Watched Folder**, then activate required families. Use `Desktop/Variable` separately when the app supports axes. Avoid activating static and variable versions with coincident names together. Keep FontBase open for activation and reopen the destination app if its list stays stale. Keep originals and licenses in `Archives` / `Licenses`.

FontBase references: [watched folders](https://forum.fontba.se/t/fontbase-fonts-folder/1689), [activation and keeping the app open](https://forum.fontba.se/t/how-do-i-refresh/301). A Watched Folder links the original directory: deleting through FontBase may delete the original too.

## Get official files

- Catalog: `https://api.fontshare.com/v2/fonts?limit=100&offset=0`; paginate to `has_more=false` and compare the count with `count_total`.
- Pairs: `https://api.fontshare.com/v2/fonts/pairs?limit=100&offset=0`; use the same check for `font_pairs`.
- Full family: `https://api.fontshare.com/v2/fonts/download/<slug>`; returns a ZIP with desktop/web files and licenses.
- Selected kit: `https://api.fontshare.com/v2/fonts/download/kit?f[]=satoshi@400,700&f[]=sentient@400`; verified in client code, not tested here as a complete download.
- CSS: `https://api.fontshare.com/v2/css?f[]=satoshi@400,700&display=swap`; use available weights. For variable fonts copy the current site's code rather than guessing parameters from axes.

To download one or all families without installing them, run from the skill directory:

```sh
python3 scripts/download.py /path/Fontshare satoshi sentient
python3 scripts/download.py /path/Fontshare --all
python3 scripts/download.py --self-test
```

The helper uses Python standard library and curl, preserves official ZIPs, and records URLs/hashes. It validates archive contents before extracting desktop OTF/TTF files and licenses only. `Desktop/Static` is ready for FontBase; the manifest proves download/files, not activation. A selection request does not imply downloading everything.

An [external downloader](https://github.com/travelhawk/fontshare-downloader), archived at inspection time, has five Python dependencies and an installation option. It is not an official Fontshare CLI. Official endpoints cover this workflow without installing that package.

## Licenses

The snapshot contains 64 ITF FFL families and 36 SIL OFL families. Read each downloaded license and the [current ITF FFL](https://www.fontshare.com/licenses/itf-ffl) or [SIL OFL](https://www.fontshare.com/licenses/sil-ofl) when downloading, sharing, embedding, or modifying fonts is in scope. Archives and the site may show different versions: record both and resolve relevant conflicts before use.

The inspected website's ITF FFL is version 2.0, dated August 17, 2026. It permits personal/commercial use, logos and wordmarks including registrable ones, and self-hosting for one's own sites/apps. It distinguishes produced artwork from font-software modification. Restrictions cover file modification, subsetting/conversion, third-party redistribution, and offering fonts as selectable assets in services/editors.

For personal proofs use local files obtained directly from Fontshare. Before uploading ITF FFL fonts to a shared cloud library or third-party editor, verify that the use is covered; otherwise use local rendering or a suitable OFL family. An existing supported local selection needs no new upload. Deliver artwork and official links; external collaborators obtain their own copies. Keep binaries outside repositories and skill packages.

SIL OFL allows modification and redistribution under its terms, including copyright/license notices and reserved-font-name conditions. Preserve license documents with files.

## Refresh the reference

Compare the live catalog with `catalog.json` slugs and live pairs with `pairs.md` IDs. For personalities, read `fonts/personalities` and rebuild assignments from `fonts?limit=100&offset=0&personalities[]=<label>`, paginating to `has_more=false`. Filtered `count_total` can describe the entire catalog: verify `count` against each returned page and slug coverage after merging labels. Keep original names and mark unlabeled slugs as missing data.

Update verified data and verification dates. Add editorial use judgments for new families, visibly separate from official data. Verify pairs and styles before attributing them to Fontshare. If the source is unavailable preserve the existing reference and disclose its snapshot date.
