#!/usr/bin/env python3
"""Download official Fontshare archives; prepare desktop files without installing."""
import argparse
import hashlib
import io
import json
from pathlib import Path, PurePosixPath
import re
import subprocess
import tempfile
import zipfile

BASE = 'https://api.fontshare.com/v2/'


def fetch(url, path):
    subprocess.run(['curl', '--fail', '--location', '--silent', '--show-error',
                    '--compressed', '--retry', '2', '--max-time', '90', url,
                    '--output', str(path)], check=True)


def members(archive):
    selected = []
    for info in archive.infolist():
        path = PurePosixPath(info.filename)
        if path.is_absolute() or '..' in path.parts or '\\' in info.filename:
            raise ValueError('Unsafe ZIP path: ' + info.filename)
        if info.is_dir():
            continue
        if info.file_size > 100_000_000:
            raise ValueError('Unexpectedly large ZIP member')
        parts = [p.lower() for p in path.parts]
        if path.suffix.lower() in {'.otf', '.ttf'} and 'web' not in parts:
            group = 'Desktop/Variable' if 'variable' in path.name.lower() else 'Desktop/Static'
            selected.append((info, group, path.name))
        elif 'license' in parts or 'licenses' in parts:
            selected.append((info, 'Licenses', path.name))
    if not any(group.startswith('Desktop/') for _, group, _ in selected):
        raise ValueError('Archive has no desktop fonts')
    if not any(group == 'Licenses' for _, group, _ in selected):
        raise ValueError('Archive has no license')
    return selected


def prepare(path, root, slug):
    with zipfile.ZipFile(path) as archive:
        selected = members(archive)
        if archive.testzip() is not None:
            raise ValueError('Corrupt ZIP: ' + str(path))
        files = []
        for info, group, name in selected:
            target = root / group / slug / name
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(archive.read(info))
            files.append(str(target.relative_to(root)))
    return {'slug': slug, 'url': BASE + 'fonts/download/' + slug,
            'sha256': hashlib.sha256(path.read_bytes()).hexdigest(), 'files': files}


def self_test():
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, 'w') as archive:
        archive.writestr('Family/Fonts/OTF/F-Regular.otf', b'font')
        archive.writestr('Family/Fonts/TTF/F-Variable.ttf', b'font')
        archive.writestr('Family/Fonts/WEB/F-Regular.ttf', b'web duplicate')
        archive.writestr('Family/License/FFL.txt', b'license')
    with zipfile.ZipFile(buffer) as archive:
        assert [group for _, group, _ in members(archive)] == [
            'Desktop/Static', 'Desktop/Variable', 'Licenses']
    with zipfile.ZipFile(buffer, 'a') as archive:
        archive.writestr('../escape.otf', b'bad')
    with zipfile.ZipFile(buffer) as archive:
        try:
            members(archive)
        except ValueError:
            pass
        else:
            raise AssertionError('Traversal accepted')
    print('Self-test passed')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('destination', nargs='?', type=Path)
    parser.add_argument('slugs', nargs='*')
    parser.add_argument('--all', action='store_true')
    parser.add_argument('--self-test', action='store_true')
    args = parser.parse_args()
    if args.self_test:
        self_test()
        return
    if not args.destination or args.all == bool(args.slugs):
        parser.error('Provide destination and either slugs or --all')
    root = args.destination.resolve()
    root.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(dir=root) as work:
        if args.all:
            slugs = []
            offset = 0
            while True:
                path = Path(work) / 'catalog.json'
                fetch(BASE + f'fonts?limit=100&offset={offset}', path)
                data = json.loads(path.read_text())
                batch = [font['slug'] for font in data['fonts']]
                if not batch or set(batch).intersection(slugs):
                    raise ValueError('Catalog pagination made no progress')
                slugs.extend(batch)
                if not data['has_more']:
                    if len(slugs) != data['count_total']:
                        raise ValueError('Incomplete catalog')
                    break
                offset += len(batch)
        else:
            slugs = list(dict.fromkeys(args.slugs))
        if any(not re.fullmatch(r'[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*', slug) for slug in slugs):
            parser.error('Invalid Fontshare slug')
        manifest_path = root / 'manifest.json'
        manifest = json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
        for slug in slugs:
            archive = root / 'Archives' / (slug + '.zip')
            archive.parent.mkdir(parents=True, exist_ok=True)
            if not archive.exists():
                temporary = Path(work) / (slug + '.zip')
                fetch(BASE + 'fonts/download/' + slug, temporary)
                with zipfile.ZipFile(temporary) as z:
                    members(z)
                    if z.testzip() is not None:
                        raise ValueError('Corrupt downloaded ZIP')
                temporary.replace(archive)
            manifest[slug] = prepare(archive, root, slug)
            temporary_manifest = root / 'manifest.json.tmp'
            temporary_manifest.write_text(json.dumps(manifest, indent=2) + '\n')
            temporary_manifest.replace(manifest_path)
            print(slug, flush=True)


if __name__ == '__main__':
    main()
