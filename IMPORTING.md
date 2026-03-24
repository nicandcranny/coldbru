# Importing from Other Clients

ColdBru supports importing collections or API definitions from several other tools and formats into its local file-based model.

## Supported Import Sources

ColdBru currently has import or conversion paths for:

- Bruno and ColdBru collections
- Postman collections
- Insomnia collections
- OpenAPI definitions
- WSDL definitions
- OpenCollection data

## General Import Flow

1. Open ColdBru and create or open the workspace you want to use.
2. Use the import collection to select the source file, export, or definition you want to bring in.
3. Choose where the imported collection should be stored on disk.
4. Review the imported result and make any adjustments needed for your workflow.

### Import Collection Menu

Use the Import Collection Menu to import collections or API definitions from supported sources.

![Import Collection menu](assets/images/import-collection.png)

## Import Notes by Source

### Bruno

- Bruno-based collections/workspaces are the smoothest to import into ColdBru.
- If you already have local collections/workspaces, you just need use the Open Workspace or Open Collection menu.

### Postman

- Export your Postman collections using [this guideline](https://learning.postman.com/docs/getting-started/importing-and-exporting/exporting-data).
- Import Postman collections into ColdBru by using the [Import Collection Menu](#import-collection-menu).
- Environments import is not supported yet from the UI. Please check the [Import using Conversion Script](#import-using-conversion-script) section.

### Insomnia

- Export your Insomnia collections using [this guideline](https://developer.konghq.com/insomnia/import-export/).
- Import Insomnia collections into ColdBru by using the [Import Collection Menu](#import-collection-menu).
- Environments import is not supported yet from the UI. Please check the [Import using Conversion Script](#import-using-conversion-script) section.

### OpenAPI

- Open ColdBru's [Import Collection Menu](#import-collection-menu).
- Upload the OpenAPI file there (or paste the OpenAPI's URL).

### WSDL

- Open ColdBru's [Import Collection Menu](#import-collection-menu).
- Upload the WSDL file there (or paste the WSDL's URL).

## Import using Conversion Script

If you need to import environments or convert many collections in one go, you can use Bruno's converter scripts:

- Package: https://www.npmjs.com/package/@usebruno/converters

This approach is useful when:

- you want to convert environments, which are not fully supported from the ColdBru UI yet
- you want to mass-convert collections from another client into Bruno-compatible files before bringing them into ColdBru

Recommended workflow:

1. Use Bruno's converter script to convert the source collection or environment into Bruno's format.
2. Copy the converted output into your workspace folder, or configure the converter output path to write there directly.
3. Open that workspace in ColdBru so the converted files live inside your normal project structure and Git repository.

For collections, you can also use the `Open Collection` menu after conversion, but this is not the recommended long-term setup because the files may remain outside the workspace's Git folder and will not be tracked by Git as part of that workspace.
