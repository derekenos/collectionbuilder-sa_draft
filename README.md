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
| delete_es_index | | Elasticsearch |
| load_es_bulk_data | | Elasticsearch |
| sync_objects | | Digital Ocean Space |


#### Install the Required Software Dependencies

*Note for MAC Users: Several dependencies can be installed using [Homebrew](https://brew.sh/). Homebrew makes the installation simple via basic command line instructions like `brew install imagemagick`

##### ImageMagick 7
ImageMagick is used by `generate-derivatives` to create small and thumbnail images from `.jpg` and `.pdf` (with Ghostscript) collection object files.

_Note that if you already have ImageMagick 6 installed and want to use that, see the note about doing so in the `Generate Derivatives` section._

Download the appropriate executable for your operating system here: https://imagemagick.org/script/download.php

The scripts expect this to be executable via the command `magick`.

The **Windows** version of ImageMagick is self-installing. Scroll down the screen to find the downloadable installer. 

ImageMagick recommends the use of [Homebrew](https://brew.sh/) for **Mac** users. After Homebrew is installed, simply type `brew install imagemagick` into the terminal.

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

**Windows**  users will use an installation wizard downloaded from the above site. Just check the default settings.

**Mac** users can use Homebrew and type `brew install ghostscript` into the command line. 

Here's an example of installation under **Ubuntu**:
```
curl -L https://github.com/ArtifexSoftware/ghostpdl-downloads/releases/download/gs952/ghostscript-9.52-linux-x86_64.tgz -O
tar xf ghostscript-9.52-linux-x86_64.tgz
sudo mv ghostscript-9.52-linux-x86_64/gs-952-linux-x86_64 /usr/local/bin/gs
rm -rf ghostscript-9.52-linux-x86_64*
```


##### Xpdf 4.02
The `pdftotext` utility in the Xpdf package is used by `extract-pdf-text` to extract text from `.pdf` collection object files.

Download the appropriate executable for your operating system under the "Download the Xpdf command line tools:" section here: http://www.xpdfreader.com/download.html

The scripts expect this to be executable via the command `pdftotext`.

**Windows**  users will need to extract the files from the downloaded .zip folder and then move the extracted directory to their program files folder. 

**Mac** users can use Homebrew and type `brew install xpdf` into the command line. 

Here's an example of installation under Ubuntu:
```
curl https://xpdfreader-dl.s3.amazonaws.com/xpdf-tools-linux-4.02.tar.gz -O
tar xf xpdf-tools-linux-4.02.tar.gz
sudo mv xpdf-tools-linux-4.02/bin64/pdftotext /usr/local/bin/
rm -rf xpdf-tools-linux-4.02*
```


##### Elasticsearch 7.7.0
Download the appropriate executable for your operating system here: https://www.elastic.co/downloads/elasticsearch

**Windows**  users will need to extract the files from the downloaded .zip folder and then move the extracted directory to their program files folder. 

**Mac** users can use homebrew. Following [these instructions]
(https://www.elastic.co/guide/en/elasticsearch/reference/current/brew.html) --> Type `brew tap elastic/tap` into your terminal "to tap the Elastic Homebrew repository." Then type `brew install elastic/tap/elasticsearch-full` to install the full version.  


Here's an example of installation under Ubuntu:
```
curl https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-7.7.0-amd64.deb -O
curl https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-7.7.0-amd64.deb.sha512 -O
sha512sum -c elasticsearch-7.7.0-amd64.deb.sha512
sudo dpkg -i elasticsearch-7.7.0-amd64.deb
```

###### Configure Elasticsearch

***For Mac and Linux Users***

Add the following lines to your `elasticsearch.yml` configuration file:

```
network.host: 0.0.0.0
discovery.type: single-node
http.cors.enabled: true
http.cors.allow-origin: "*"
```

Following the above installation for Ubuntu, `elasticsearch.yml` can be found in the directory `/etc/elasticsearch`

**Mac** users can find `elasticsearch.yml` in the directory `/usr/local/etc/elasticsearch/`

###### Update `_config.yml`
Update [\_config.yml](https://github.com/CollectionBuilder/collectionbuilder-sa_draft/blob/master/_config.yml#L17-L21) to reflect your Elasticsearch server configuration. E.g.:
```
elasticsearch-protocol: http
elasticsearch-host: 0.0.0.0
elasticsearch-port: 9200
elasticsearch-index: moscon_programs_collection
```

***For Windows Users***

Add the following lines to your `elasticsearch.yml` configuration file:

```
network.host: localhost
discovery.type: single-node
http.cors.enabled: true
http.cors.allow-origin: "*"
```

Following the above installation for Ubuntu, `elasticsearch.yml` can be found in the directory `/etc/elasticsearch`

###### Update `_config.yml`
Update [\_config.yml](https://github.com/CollectionBuilder/collectionbuilder-sa_draft/blob/non-docker/_config.yml#L17-L21) to reflect your Elasticsearch server configuration. E.g.:
```
elasticsearch-protocol: http
elasticsearch-host: localhost
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

**Windows** users may have trouble here with the various ports not allowing access. 

Local development usage:
```
rake create_es_index
```

To target your production Elasticsearch instance, you must specify a user profile name argument:

```
rake create_es_index[<profile-name>]
```

For example, to specify the user profile name "admin":

```
rake create_es_index[admin]
```

When you specify a user profile name, the task assumes that you want to target the production Elasticsearch instance and will read the connection information from `_config.production.yml` and the username / password for the specified profile from your Elasticsearch credentials file.

See: [Creating Your Local Elasticsearch Credentials File](#creating-your-local-elasticsearch-credentials-file)


#### 5.5 Load Data into the Search Index
Use the `load_es_bulk_data` rake task to load the collection data into the Elasticsearch index.

Local development usage:
```
rake load_es_bulk_data
```

To target your production Elasticsearch instance, you must specify a user profile name argument:

```
rake load_es_bulk_data[<profile-name>]
```

For example, to specify the user profile name "admin":

```
rake load_es_bulk_data[admin]
```

When you specify a user profile name, the task assumes that you want to target the production Elasticsearch instance and will read the connection information from `_config.production.yml` and the username / password for the specified profile from your Elasticsearch credentials file.

See: [Creating Your Local Elasticsearch Credentials File](#creating-your-local-elasticsearch-credentials-file)


### 6. Start the Development Server
```
bundle exec jekyll s -H 0.0.0.0
```


## Deploy a Production Elasticsearch Instance on a Digital Ocean Droplet

This section will describe how to get Elasticsearch up and running on a Digital Ocean Droplet using our preconfigured, custom disk image.

1. Import our custom Elasticsearch image via the Digital Ocean web console by navigating to:

    ```
    Images -> Custom Images -> Import via URL
    ```

    and entering the URL: https://collectionbuilder-sa-demo.s3.amazonaws.com/collectionbuilder-elasticsearch-1-0.vmdk

    ![do_custom_image_import](https://user-images.githubusercontent.com/585182/87325500-8678f500-c4ff-11ea-9a70-e65b437b4c20.gif)

- You will need to select a "Distribution" -- Choose `Ubuntu`. 
- You will need to select a distribution center location. Choose the location closest to your physical location. 

2. Once the image is available within your account, click on `More -> Start a droplet`

- You can simply leave the default settings and scroll to the bottom of the page to start this. 

3. Once the Droplet is running, navigate to:

    ```
    Networking -> Firewalls -> Create Firewall
    ```
    
    Give the firewall a name and add the rules as depicted in the below screenshot:

    ![Screenshot from 2020-07-13 12-05-32](https://user-images.githubusercontent.com/585182/87326758-2c792f00-c501-11ea-9a82-45977a8c7582.png)

    - The `HTTP TCP 80` rule allows the `certbot` SSL certificate application that we'll soon run to verify that we own this machine. We'll delete this rule after the certificate process is complete.

    - The `Custom TCP 9200` rule enables external access to the Elasticsearch instance.

    In the `Apply to Droplets` section, specify the name of the previously-created Elasticsearch Droplet and click `Create Firewall`

    This can be found at the top of the page for the firewall. There is a `droplets` menu option (it's a little hard to see). Click that and then specifiy the name of the droplet you created.

4. Generate your SSL certificate

    The Elasticsearch server is configured to use secure communication over HTTPS, which requires an SSL certificate. In order to request a free SSL certificate from Let's Encrypt, you first need to ensure that your Elasticsearch server is accessible via some registered web domain. To do this, you'll need to create a `A`-type DNS record that points some root/sub-domain to the IP address of your Droplet.

    1. Create a DNS record for your Droplet
        1. In the Digital Ocean UI, navigate to `Droplets -> <the-droplet>`
        2. Take note of the `ipv4` IP address displayed at the top
        3. However you do this, create a `A` DNS record to associate a root/sub-domain with your Droplet IP address

  You will need to have a domain to create an A record. If you have one hosted somewhere, such as a personal website, you can go to the area where they manage the DNS records (A and CNAME, etc.) and add an A record to a new subdomain, such as, digitalocean.johndoe.com and point it to the ipv4 IP addresss on your Droplet. 

  Once that is set up, you will enter that full domain (i.e. `digitalocean.johndoe.com) in step 9 below to generate the certificate. 

    2. Generate the certificate
        1. In the Digital Ocean UI, navigate to `Droplets -> <the-droplet>`
        2. Click the `Console []` link on the right side (it's a blue link at the top right)
        3. At the `elastic login:` prompt, type `ubuntu` and hit `ENTER`
        4. At the `Password:` prompt, type `password` and hit `ENTER`
        5. Type `sudo ./get-ssl-certificate` and hit `ENTER`, type `password` and hit `ENTER`
        6. Enter an email address to associate with your certificate
        7. Type `A` then `ENTER` to agree to the terms of service
        8. Specify whether you want to share your email address with the EFF
        9. Enter the name of the root/sub-domain for which you created the `A` record associated with your Droplet IP address
        10. Restart Elasticsearch so that it will use the new certificate by executing `sudo systemctl restart elasticsearch`


5. Check that Elasticsearch is accessible via HTTPS

    1. In a web browser, surf on over to: `https://<the-root/sub-domain-you-created>:9200` and you should see something like this:
    
    ![Screenshot from 2020-07-16 16-21-18](https://user-images.githubusercontent.com/585182/87718795-6ad05180-c780-11ea-909e-87f5f6c9ef21.png)
    
    It's reporting a `security_exception` because the server is configured to prevent anonymous, public users from accessing things they shouldn't. You'll see a more friendly response at: `https://<the-root/sub-domain-you-created>:9200/_search`
    

6. Delete the HTTP ingress firewall rule

    The HTTP firewall ingress rule is only required for the initial certificate generation process and should be removed once the certificate is obtained.
    To do this:

    1. In the Digital Ocean UI, natigate to `Networking -> Firewalls`
    2. Click on the firewall that you created
    3. Next to the `HTTP` entry in `Inbound Rules`, click `More` and then `Delete Rule`


7. Generate your Elasticsearch passwords

    In order to securely administer your Elasticsearch server, you'll need to generate passwords for the built-in Elasticsearch users.

    If necessary, open a console window:

        1. In the Digital Ocean UI, navigate to `Droplets -> <the-droplet>`
        2. Click the `Console []` link on the right side
        3. At the `elastic login:` prompt, type `ubuntu` and hit `ENTER`
        4. At the `Password:` prompt, type `password` and hit `ENTER`
    
    Execute the command:

    ```
    sudo /usr/share/elasticsearch/bin/elasticsearch-setup-passwords auto
    ```

    The script will display the name and newly-generated password for each of the built-in Elasticsearch users - copy these down and save them in a safe place. You will be using the `elastic` user credentials to later administer the server. See: [Creating Your Local Elasticsearch Credentials File](#creating-your-local-elasticsearch-credentials-file)


8. Change the `ubuntu` user password

    Every droplet that someone creates from the provided custom disk image is going to have the same default `ubuntu` user password of `password`. For better security, you should change this to your own, unique password.

    If necessary, open a console window:

        1. In the Digital Ocean UI, navigate to `Droplets -> <the-droplet>`
        2. Click the `Console []` link on the right side
        3. At the `elastic login:` prompt, type `ubuntu` and hit `ENTER`
        4. At the `Password:` prompt, type `password` and hit `ENTER`

   Execute the command:

    ```
    sudo passwd ubuntu 
    ```

    The flow looks like this:

    ```
    [sudo] password for ubuntu: <enter-the-current-password-ie-"password">
    New password: <enter-your-new-password>
    Retype new password: <enter-your-new-password>
    passwd: password updated successfully
    ```


## Creating Your Local Elasticsearch Credentials File<a id="creating-your-local-elasticsearch-credentials-file"></a>

After generating passwords for your built-in Elasticsearch users, the ES-related rake tasks will need access to these usernames / passwords (namely that of the `elastic` user) in order to communicate with the server. This is done by creating a local Elasticsearch credentials file.

By default, the tasks will look for this file at: `<user-home>/.elasticsearch/credentials`. If you want to change this location, you can do so [here](https://github.com/CollectionBuilder/collectionbuilder-sa_draft/blob/master/Rakefile#L14).

This credentials file must formatted as YAML as follows:

```
users:
  <profile-name>:
    username: <elasticsearch-username>
    password: <elasticsearch-password>
```

Here's a template that works with the other examples in this documentation, requiring only that you fill in the `elastic` user password:

```
users:
  admin:
    username: elastic
    password: <password>
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


## Updating `data/config-search.csv` For An Existing Elasticsearch Index

The search configuration in `config-search.csv` is used by the `generate_es_index_settings` rake task to generate an Elasticsearch index settings file which the `create_es_index` rake task then uses to create a new Elasticsearch index. If you need to make changes to `config-search.csv` after the index has already been created, you will need to synchronize these changes to Elasticsearch in order for the new configuration to take effect.

While there are a number of ways to achieve this (see: [Index Aliases and Zero Downtime](https://www.elastic.co/guide/en/elasticsearch/guide/current/index-aliases.html#index-aliases)), the easiest is to:

1. Delete the existing index by executing the `delete_es_index` rake task. See `create_es_index` for how to specify a user profile name if you need to target your production Elasticsearch instance.

2. Execute the `generate_es_index_settings` and `create_es_index` rake tasks to create a new index using the updated `config-search.csv` configuration

3. Execute the `load_es_bulk_data` rake task to load the documents into the new index
