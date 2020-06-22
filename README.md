# collectionbuilder-sa_draft

draft of a stand alone style collection.
uses data from [Moscon](https://www.lib.uidaho.edu/digital/moscon/), but not really customized to the collection.
Objects are simply in a folder.
Every object has an image in "thumbs" and "small" named after `objectid`, and an original object item in the root folder named after `filename` column.

### 0. Prerequisites

#### Ruby and Gems

See: https://collectionbuilder.github.io/docs/software.html#ruby

The code in this repo has been verified to work with the following versions:

| name | version |
| --- | --- |
| ruby | 2.7.0 |
| bundler | 2.1.4 |
| jekyll | 4.1.0 |
| aws-sdk-s3 | 1.66.0 |

After the `bundler` gem is installed, run the following command to install the remaining dependencies specified in the `Gemfile`:

```
bundle install
```

#### Rake Task Dependencies

The rake tasks that we'll be using have the following dependencies:

| task name | software dependencies | service dependencies |
| --- | --- | --- |
| generate_derivatives | ImageMagick 7 (or compatible), Ghostscript 9.52 (or compatible) | |
| generate_es_index_settings | | |
| extract_pdf_text | xpdf | |
| generate_es_bulk_data | |
| create_es_index | | Elasticsearch |
| load_es_bulk_data | | Elasticsearch |
| sync_objects | | Digital Ocean Space |


#### Install the Required Software Dependencies

##### ImageMagick 7
ImageMagick is used by `generate-derivatives` to create small and thumbnail images from `.jpg` and `.pdf` (with Ghostscript) collection object files.

_Note that if you already have ImageMagick 6 installed and want to use that, see the note about doing so in the `Generate Derivatives` section._

Download the appropriate executable for your operating system here: https://imagemagick.org/script/download.php

The scripts expect this to be executable via the command `magick`.

Here's an example of installation under Ubuntu:
```
curl https://imagemagick.org/download/binaries/magick -O
chmod +x magick
sudo mv magick /usr/local/bin/
```


##### Ghostscript 9.52
Ghostscript is used behind the scenes by ImageMagick in `generate-derivatives` to create small and thumbnail images from `.pdf` collection object files.

Download the appropriate executable for your operating system here: https://www.ghostscript.com/download/gsdnld.html

The scripts expect this to be executable via the command `gs`.

Here's an example of installation under Ubuntu:
```
curl -L https://github.com/ArtifexSoftware/ghostpdl-downloads/releases/download/gs952/ghostscript-9.52-linux-x86_64.tgz -O
tar xf ghostscript-9.52-linux-x86_64.tgz
sudo mv ghostscript-9.52-linux-x86_64/gs-952-linux-x86_64 /usr/local/bin/gs
rm -rf ghostscript-9.52-linux-x86_64*
```


##### Xpdf 4.02
The `pdftotext` utility in the Xpdf package is used by `extract-pdf-text` to extract text from `.pdf` collection object files.

Download the appropriate executable for your operating system under the "... command line tools" section here: http://www.xpdfreader.com/download.html

The scripts expect this to be executable via the command `pdftotext`.

Here's an example of installation under Ubuntu:
```
curl https://xpdfreader-dl.s3.amazonaws.com/xpdf-tools-linux-4.02.tar.gz -O
tar xf xpdf-tools-linux-4.02.tar.gz
sudo mv xpdf-tools-linux-4.02/bin64/pdftotext /usr/local/bin/
rm -rf xpdf-tools-linux-4.02*
```


##### Elasticsearch 7.7.0
Download the appropriate executable for your operating system here: https://www.elastic.co/downloads/elasticsearch

Here's an example of installation under Ubuntu:
```
curl https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-7.7.0-amd64.deb -O
curl https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-7.7.0-amd64.deb.sha512 -O
sha512sum -c elasticsearch-7.7.0-amd64.deb.sha512
sudo dpkg -i elasticsearch-7.7.0-amd64.deb
```

###### Configure Elasticsearch
Add the following lines to your `elasticsearch.yml` configuration file:

```
network.host: 0.0.0.0
discovery.type: single-node
http.cors.enabled: true
http.cors.allow-origin: "*"
```

Following the above installation for Ubuntu, `elasticsearch.yml` can be found in the directory `/etc/elasticsearch`

###### Update `_config.yml`
Update [\_config.yml](https://github.com/CollectionBuilder/collectionbuilder-sa_draft/blob/non-docker/_config.yml#L17-L21) to reflect your Elasticsearch server configuration. E.g.:
```
elasticsearch-protocol: http
elasticsearch-host: 0.0.0.0
elasticsearch-port: 9200
elasticsearch-index: moscon_programs_collection
```


## Setting Up Your Local Development Environment


### 1. Collect Your Data
- [create your metadata CSV file](https://collectionbuilder.github.io/docs/metadata.html)
- place your collection objects in the `<repository>/objects` directory


### 2. Set Your Search Configuration

[config-search.csv](https://github.com/CollectionBuilder/collectionbuilder-sa_draft/blob/master/_data/config-search.csv) defines the settings for the fields that you want indexed and displayed in search.

Example (as a table):

|field|index|display|facet|multi-valued|
|---|---|---|---|---|
title|true|true|false|false
date|true|true|false|false
description|true|false|false|false
creator|true|false|true|true
subject|true|false|true|true
location|true|false|true|true
full_text|true|false|false|false


### 3. Generate Derivatives
Use the `generate_derivatives` rake task to generate a set of images for each of your collection files.

Usage:
```
rake generate_derivatives
```

This task automatically creates `/small` and `/thumbs` subdirectories as necessary within the `objects/` directory, into which it will put the files that it generates.

The following configuration options are available:

| option | description | default value |
| --- | --- | --- |
| thumbs_size | the dimensions of the generated thumbnail images | 300x300 |
| small_size | the dimensions of the generated small images | 800x800 |
| density | the pixel density used to generate PDF thumbnails | 300 |
| missing | whether to only generate derivatives that don't already exist | true |
| im_executable | ImageMagick executable name | magick |

You can configure any or all of these options by specifying them in the rake command like so:
```
rake generate_derivatives[<thumb_size>,<small_size>,<density>,<missing>]
```
Here's an example of overriding all of the option values:
```
rake generate_derivatives[100x100,300x300,70,false]
```
It's also possible to specify individual options that you want to override, leaving the others at their defaults.
For example, if you only wanted to set `density` to `70`, you can do:
```
rake generate_derivatives[,,70]
```

#### Using ImageMagick 6 (tested with `v6.9.7`)

If using ImageMagick 6, you need to set the `im_executable` configuration option to `convert`:
```
rake generate_derivatives[,,,,convert]
```


### 4. Start Elasticsearch

Though this step is platform dependent, you might accomplish this by executing `elasticsearch` in a terminal.


### 5. Generate and load the Elasticsearch data

#### 5.1 Extract PDF Text
Use the `extract_pdf_text` rake task to extract the text from your collection PDFs so that we can perform full-text searches on these documents.

Usage:
```
rake extract_pdf_text
```

#### 5.2 Generate the Search Index Data File
Use the `generate_es_bulk_data` rake task to generate a file, using the collection metadata and extracted PDF text, that can be used to populate the Elasticsearch index.

Usage:
```
rake generate_es_bulk_data
```

#### 5.3 Generate the Search Index Settings File
Use the `generate_es_index_settings` rake task to create an Elasticsearch index settings file from the configuration in `config-search.csv`.

Usage:
```
rake generate_es_index_settings
```

#### 5.4 Create the Search Index
Use the `create_es_index` rake task to create the Elasticsearch index from the index settings file.

Usage:
```
rake create_es_index
```

#### 5.5 Load Data into the Search Index
Use the `load_es_bulk_data` rake task to load the collection data into the Elasticsearch index.

Usage:
```
rake load_es_bulk_data
```


### 6. Start the Development Server
```
bundle exec jekyll s -H 0.0.0.0
```


## Setting Up Your Local Production-Preview Environment

The **Preview-Production** environment allows you to configure the local development web server to access the collection objects at a remote source (e.g. Digital Ocean Space) instead of from the local `objects/` directory. This helps to ensure that your remote storage is properly configured before deploying the production site.

### 1. Edit the Production-Preview Configuration

Update the `digital-objects` value in `_config.production_preview.yml` with the "Edge" endpoint URL of your Digital Ocean Space.

### 2. Configure Your AWS Credentials

Digital Ocean Spaces use an API that's compatible with Amazon's AWS S3 service. The `sync_objects` rake task that we use in the next step uses the AWS Ruby SDK to interact with the Digital Ocean Space. To enable `sync_objects` to access the Space, you need to configure your shared AWS credentials as described here: https://docs.aws.amazon.com/sdk-for-ruby/v3/developer-guide/setup-config.html#aws-ruby-sdk-credentials-shared

You can generate your Digital Ocean access key by going to your DO account page and clicking on:
API -> Spaces access keys -> Generate New Key

### 3. Upload Your Objects to the Digital Ocean Space

Use the `sync_objects` rake task to upload your objects to the Digital Ocean Space.

Usage:
```
rake sync_objects
```

If you're using the AWS `.../.aws/credentials` file approach and you have multiple named profiles, you can specify which profile you'd like to use as follows:
```
rake sync_objects[<profile_name>]
```

For example, to use a profile named "collectionbuilder":
```
rake sync_objects[collectionbuilder]
```

### 3. Start the Production-Preview Server

```
jekyll s -H 0.0.0.0 --config _config.yml,_config.production_preview.yml
```
