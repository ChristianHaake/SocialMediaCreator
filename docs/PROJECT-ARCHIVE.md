# SocialMediaCreator Project Archive

SocialMediaCreator saves the active module as a `.smc` project archive. The
file is a standard ZIP container created and read entirely in the browser.

## Directory structure

```text
project.smc
├── project.json
└── media/
    ├── 0001.webp
    └── 0002.png
```

Only `project.json` and numbered WebP or PNG files under `media/` are allowed.
User-provided filenames are metadata and are never used as archive paths.

## Manifest

`project.json` uses archive format `social-media-creator-project` version `1`.
The embedded `config` remains the existing Config V6 object.

```json
{
  "format": "social-media-creator-project",
  "version": 1,
  "config": {
    "format": "social-media-creator-config",
    "version": 6,
    "locale": "de",
    "module": "photoPost",
    "data": {}
  },
  "media": [
    {
      "path": "media/0001.webp",
      "originalFileName": "profil.png",
      "reference": {
        "kind": "photo-profile",
        "postId": "photo-post-1"
      }
    }
  ]
}
```

Supported media references are:

- `photo-profile`: `postId`
- `photo-media`: `postId`, `mediaId`
- `photo-comment`: `postId`, `itemId`
- `messenger-profile`: `profileId`
- `microblog-profile`: `postId`
- `microblog-comment`: `postId`, `itemId`

Comment `itemId` values may identify a comment or a direct reply.

## Image processing and limits

- Accepted source formats: PNG, JPEG, and WebP.
- Maximum source file size: 5 MB.
- Maximum source width and height: 4096 pixels.
- Saved images are encoded sequentially as WebP with a maximum edge of
  2048 pixels and quality `0.82`.
- Browsers without canvas WebP encoding use PNG as a transparency-preserving
  fallback.
- Media entries are stored without additional ZIP compression.
- Maximum total uncompressed archive size: 25 MB.
- Maximum `project.json` size: 1 MB.

These limits reduce peak memory consumption in mobile browsers. Archives
contain optimized project assets, not the original source files.

## Validation and security

Before extraction, the importer reads the ZIP central directory and rejects:

- encrypted, ZIP64, unsupported, corrupt, or truncated archives
- absolute paths, backslashes, path traversal, and duplicate paths
- unknown files or archive entries outside the defined layout
- declared uncompressed data above the project limits

After extraction, actual byte counts are checked again. The manifest,
configuration, media signatures, image decoding, dimensions, referenced IDs,
and one-to-one mapping between manifest and archive entries must all validate.
The current editor state is replaced only after the complete archive passes.

## Compatibility

- `.smc` archive version 1 embeds Config V6.
- Existing Config V6 JSON files remain importable.
- Config V5 JSON files remain importable and are migrated as German Config V6
  projects.
- Legacy JSON imports contain no media and therefore clear images for the
  imported module.
