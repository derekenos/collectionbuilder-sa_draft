
require 'csv'
require 'json'
require 'yaml'
require 'net/http'

require 'aws-sdk-s3'


###############################################################################
# Constants
###############################################################################

$ES_CREDENTIALS_PATH = File.join [Dir.home, ".elasticsearch", "credentials"]
$ES_BULK_DATA_FILENAME = 'es_bulk_data.jsonl'
$ES_INDEX_SETTINGS_FILENAME = 'es_index_settings.json'
$SEARCH_CONFIG_PATH = File.join(['_data', 'config-search.csv'])
$ENV_CONFIG_FILENAMES_MAP = {
  :DEVELOPMENT => [ '_config.yml' ],
  :PRODUCTION_PREVIEW => [ '_config.yml', '_config.production_preview.yml' ],
  :PRODUCTION => [ '_config.yml', '_config.production.yml' ],
}

###############################################################################
# Helper Functions
###############################################################################

$ensure_dir_exists = ->(dir) { if !Dir.exists?(dir) then Dir.mkdir(dir) end }

def prompt_user_for_confirmation message
  response = nil
  while true do
    # Use print instead of puts to avoid trailing \n.
    print "#{message} (Y/n): "
    $stdout.flush
    response =
      case STDIN.gets.chomp.downcase
      when "", "y"
        true
      when "n"
        false
      else
        nil
      end
    if response != nil
      return response
    end
    puts "Please enter \"y\" or \"n\""
  end
end

def load_config env = :DEVELOPMENT
  # Read the config files and validate and return the values required by rake
  # tasks.

  # Get the config as defined by the env argument.
  filenames = $ENV_CONFIG_FILENAMES_MAP[env]
  config = {}
  filenames.each do |filename|
    config.update(YAML.load_file filename)
  end

  # Read the digital objects location.
  digital_objects_location = config['digital-objects']
  if !digital_objects_location
    raise "digital-objects is not defined in _config*.yml for environment: #{env}"
  end
  # Strip any trailing slash.
  digital_objects_location.delete_suffix! '/'

  # Load the collection metadata.
  metadata_name = config['metadata']
  if !metadata_name
    raise "metadata must be defined in _config.yml"
  end
  metadata = CSV.parse(File.read(File.join(['_data', "#{metadata_name}.csv"])), headers: true)

  # Load the search configuration.
  search_config = CSV.parse(File.read($SEARCH_CONFIG_PATH), headers: true)

  retval = {
    :metadata => metadata,
    :search_config => search_config,
    :elasticsearch_protocol => config['elasticsearch-protocol'],
    :elasticsearch_host => config['elasticsearch-host'],
    :elasticsearch_port => config['elasticsearch-port'],
    :elasticsearch_index => config['elasticsearch-index'],
  }

  # Add environment-dependent values.
  if env == :DEVELOPMENT
    # If present, strip out the baseurl prefix.
    if digital_objects_location.start_with? config['baseurl']
      digital_objects_location = digital_objects_location[config['baseurl'].length..-1]
      # Trim any leading slash from the objects directory
      digital_objects_location.delete_prefix! '/'
    end
    retval.update({
      :objects_dir => digital_objects_location,
      :thumb_images_dir => File.join([digital_objects_location, 'thumbs']),
      :small_images_dir => File.join([digital_objects_location, 'small']),
      :extracted_pdf_text_dir => File.join([digital_objects_location, 'extracted_text']),
      :elasticsearch_dir => File.join([digital_objects_location, 'elasticsearch']),
    })
  else
    # Environment is PRODUCTION_PREVIEW or PRODUCTION.
    retval.update({
      :remote_objects_url => digital_objects_location,
      :remote_thumb_images_url => File.join([digital_objects_location, 'thumbs']),
      :remote_small_images_url => File.join([digital_objects_location, 'small']),
    })
  end

  return retval
end

def get_es_user_credentials user = "admin"
  # Return the username and password for the specified Elasticsearch user.
  creds = YAML.load_file $ES_CREDENTIALS_PATH
  if !creds.include? "users"
    raise "\"users\" key not found in: #{$ES_CREDENTIALS_PATH}"
  elsif !creds["users"].include? user
    raise "No credentials found for user: \"#{user}\""
  else
    return creds["users"][user]
  end
end

def elasticsearch_ready config
  # Return a boolean indicating whether the Elasticsearch instance is available.
  req = Net::HTTP.new(config[:elasticsearch_host], config[:elasticsearch_port])
  if config[:elasticsearch_protocol] == 'https'
    req.use_ssl = true
  end
  begin
    res = req.send_request('GET', '/')
  rescue StandardError
    false
  else
    res.code == '200'
  end
end


###############################################################################
# TASK: deploy
###############################################################################

desc "Build site with production env"
task :deploy do
  ENV["JEKYLL_ENV"] = "production"
  sh "jekyll build"
end


###############################################################################
# TASK: generate_derivatives
###############################################################################

desc "Generate derivative image files from collection objects"
task :generate_derivatives, [:thumbs_size, :small_size, :density, :missing, :im_executable] do |t, args|
  args.with_defaults(
    :thumbs_size => "300x300",
    :small_size => "800x800",
    :density => "300",
    :missing => "true",
    :im_executable => "magick",
  )

  config = load_config :DEVELOPMENT
  objects_dir = config[:objects_dir]
  thumb_images_dir = config[:thumb_images_dir]
  small_images_dir = config[:small_images_dir]

  # Ensure that the output directories exist.
  [thumb_images_dir, small_images_dir].each &$ensure_dir_exists

  EXTNAME_TYPE_MAP = {
    '.jpg' => :image,
    '.pdf' => :pdf
  }

  # Generate derivatives.
  Dir.glob(File.join([objects_dir, '*'])).each do |filename|
    # Ignore subdirectories.
    if File.directory? filename
      next
    end

    # Determine the file type and skip if unsupported.
    extname = File.extname(filename).downcase
    file_type = EXTNAME_TYPE_MAP[extname]
    if !file_type
      puts "Skipping file with unsupported extension: #{extname}"
      next
    end

    # Define the file-type-specific ImageMagick command prefix.
    cmd_prefix =
      case file_type
      when :image then "#{args.im_executable} #{filename}"
      when :pdf then "#{args.im_executable} -density #{args.density} #{filename}[0]"
      end

    # Get the lowercase filename without any leading path and extension.
    base_filename = File.basename(filename)[0..-(extname.length + 1)].downcase

    # Generate the thumb image.
    thumb_filename=File.join([thumb_images_dir, "#{base_filename}_th.jpg"])
    if args.missing == 'false' or !File.exists?(thumb_filename)
      puts "Creating: #{thumb_filename}";
      system("#{cmd_prefix} -resize #{args.thumbs_size} -flatten #{thumb_filename}")
    end

    # Generate the small image.
    small_filename = File.join([small_images_dir, "#{base_filename}_sm.jpg"])
    if args.missing == 'false' or !File.exists?(small_filename)
      puts "Creating: #{small_filename}";
      system("#{cmd_prefix} -resize #{args.small_size} -flatten #{small_filename}")
    end
  end
end


###############################################################################
# extract_pdf_text
###############################################################################

desc "Extract the text from PDF collection objects"
task :extract_pdf_text do

  config = load_config :DEVELOPMENT
  output_dir = config[:extracted_pdf_text_dir]
  $ensure_dir_exists.call output_dir

  # Extract the text.
  num_items = 0
  Dir.glob(File.join([config[:objects_dir], "*.pdf"])).each do |filename|
    output_filename = File.join([output_dir, "#{File.basename filename}.txt"])
    system("pdftotext -enc UTF-8 -eol unix -nopgbrk #{filename} #{output_filename}")
    num_items += 1
  end
  puts "Extracted text from #{num_items} PDFs into: #{output_dir}"
end


###############################################################################
# generate_es_bulk_data
###############################################################################

desc "Generate the file that we'll use to populate the Elasticsearch index via the Bulk API"
task :generate_es_bulk_data do

  config = load_config :DEVELOPMENT

  # Create a search config <fieldName> => <configDict> map.
  field_config_map = {}
  config[:search_config].each do |row|
    field_config_map[row["field"]] = row
  end

  output_dir = config[:elasticsearch_dir]
  $ensure_dir_exists.call output_dir
  output_path = File.join([output_dir, $ES_BULK_DATA_FILENAME])
  output_file = File.open(output_path, mode: "w")
  index_name = config[:elasticsearch_index]
  num_items = 0
  config[:metadata].each do |item|
    # Remove any fields with an empty value.
    item.delete_if { |k, v| v.nil? }

    # Split each multi-valued field value into a list of values.
    item.each do |k, v|
      if field_config_map.has_key? k and field_config_map[k]["multi-valued"] == "true"
        item[k] = (v or "").split(";").map { |s| s.strip }
      end
    end

    item_text_path = File.join([config[:extracted_pdf_text_dir], "#{item["filename"]}.txt"])
    if File::exists? item_text_path
      full_text = File.read(item_text_path, mode: "r", encoding: "utf-8")
      item["full_text"] = full_text
    end

    # Write the action_and_meta_data line.
    doc_id = item["objectid"]
    output_file.write("{\"index\": {\"_index\": \"#{index_name}\", \"_id\": \"#{doc_id}\"}}\n")

    # Write the source line.
    output_file.write("#{JSON.dump(item.to_hash)}\n")

    num_items += 1
  end

  puts "Wrote #{num_items} items to: #{output_path}"
end


###############################################################################
# generate_es_index_settings
###############################################################################

"""
Generate a file that comprises the Mapping settings for the Elasticsearch index
from the configuration specified in _data/config.search.yml

https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping.html
"""

desc "Generate the settings file that we'll use to create the Elasticsearch index"
task :generate_es_index_settings do
  TEXT_FIELD_DEF_KEYS = [ 'field' ]
  BOOL_FIELD_DEF_KEYS = [ 'index', 'display', 'facet', 'multi-valued' ]
  VALID_FIELD_DEF_KEYS = TEXT_FIELD_DEF_KEYS.dup.concat BOOL_FIELD_DEF_KEYS
  INDEX_SETTINGS_TEMPLATE = {
    mappings: {
      dynamic_templates: [
        {
          store_as_unindexed_text: {
            match_mapping_type: "*",
            mapping: {
              type: "text",
              index: false
            }
          }
        }
      ],
      properties: {
        # Always include objectid.
        objectid: {
          type: "text",
          index: false
        }
      }
    }
  }

  def assert_field_def_is_valid field_def
    # Assert that the field definition is valid.
    keys = field_def.to_hash.keys

    missing_keys = VALID_FIELD_DEF_KEYS.reject { |k| keys.include? k }
    extra_keys = keys.reject { |k| VALID_FIELD_DEF_KEYS.include? k }
    if !missing_keys.empty? or !extra_keys.empty?
      msg = "The field definition: #{field_def}"
      if !missing_keys.empty?
        msg = "#{msg}\nis missing the required keys: #{missing_keys}"
      end
      if !extra_keys.empty?
        msg = "#{msg}\nincludes the unexpected keys: #{extra_keys}"
      end
      raise msg
    end

    invalid_bool_value_keys = BOOL_FIELD_DEF_KEYS.reject { |k| ["true", "false"].include? field_def[k] }
    if !invalid_bool_value_keys.empty?
      raise "Expected true/false value for: #{invalid_bool_value_keys.join(", ")}"
    end

    if field_def["index"] == "false" and
      (field_def["facet"] == "true" or field_def['multi-valued'] == "true")
      raise "Field (#{field_def["field"]}) has index=false but other index-related "\
            "fields (e.g. facet, multi-valued) specified as true"
    end

    if field_def['multi-valued'] == "true" and field_def['facet'] != "true"
      raise "If field (#{field_def["field"]}) specifies multi-valued=true, it "\
            "also needs to specify facet=true"
    end
  end

  def convert_field_def_bools field_def
    # Do an in-place conversion of the bool strings to python bool values.
    BOOL_FIELD_DEF_KEYS.each do |k|
      field_def[k] = field_def[k] == "true"
    end
  end

  def get_mapping field_def
    # Return an ES mapping configuration object for the specified field definition.
    mapping = {
      type: "text"
    }
    if field_def["facet"]
      mapping["fields"] = {
        raw: {
          type: "keyword"
        }
      }
    end
    return mapping
  end

  # Main block
  config = load_config :DEVELOPMENT

  index_settings = INDEX_SETTINGS_TEMPLATE.dup
  config[:search_config].each do |field_def|
    assert_field_def_is_valid(field_def)
    convert_field_def_bools(field_def)
    if field_def["index"]
      index_settings[:mappings][:properties][field_def["field"]] = get_mapping(field_def)
    end
  end

  output_dir = config[:elasticsearch_dir]
  $ensure_dir_exists.call output_dir
  output_path = File.join([output_dir, $ES_INDEX_SETTINGS_FILENAME])
  output_file = File.open(output_path, mode: "w")
  output_file.write(JSON.pretty_generate(index_settings))
  puts "Wrote: #{output_path}"
end


###############################################################################
# create_es_index
###############################################################################

desc "Create the Elasticsearch index"
task :create_es_index, [:es_user] do |t, args|
  args.with_defaults(
    :es_user => nil,
  )

  # If es_user was specified, target the production ES server.
  env = if args.es_user != nil then :PRODUCTION_PREVIEW else :DEVELOPMENT end
  config = load_config env

  protocol = config[:elasticsearch_protocol]
  host = config[:elasticsearch_host]
  port = config[:elasticsearch_port]
  path = "/#{config[:elasticsearch_index]}"
  req = Net::HTTP::Put.new(path, initheader = { 'Content-Type' => 'application/json' })

  # Get the local ES config file location from the development config.
  dev_config = load_config :DEVELOPMENT

  # If an Elasticsearch user was specified, use their credentials to configure
  # basic auth.
  if args.es_user != nil
    es_creds = get_es_user_credentials args.es_user
    req.basic_auth es_creds["username"], es_creds["password"]
  end

  req.body = File.open(File.join([dev_config[:elasticsearch_dir], $ES_INDEX_SETTINGS_FILENAME]), 'rb').read

  res = Net::HTTP.start(host, port, :use_ssl => config[:elasticsearch_protocol] == 'https') do |http|
    http.request(req)
  end

  if res.code == '200'
    puts "Created Elasticsearch index: #{config[:elasticsearch_index]}"
  else
    data = JSON.load(res.body)
    if data['error']['type'] == 'resource_already_exists_exception'
      puts "Elasticsearch index (#{config[:elasticsearch_index]}) already exists"
    else
      raise res.body
    end
  end
end


###############################################################################
# delete_es_index
###############################################################################

desc "Delete the Elasticsearch index"
task :delete_es_index, [:es_user] do |t, args|
  args.with_defaults(
    :es_user => nil,
  )

  # If es_user was specified, target the production ES server.
  env = if args.es_user != nil then :PRODUCTION_PREVIEW else :DEVELOPMENT end
  config = load_config env

  res = prompt_user_for_confirmation "Really delete index \"#{config[:elasticsearch_index]}\"?"
  if res == false
    next
  end

  protocol = config[:elasticsearch_protocol]
  host = config[:elasticsearch_host]
  port = config[:elasticsearch_port]
  path = "/#{config[:elasticsearch_index]}"
  req = Net::HTTP::Delete.new(path)

  # If an Elasticsearch user was specified, use their credentials to configure
  # basic auth.
  if args.es_user != nil
    es_creds = get_es_user_credentials args.es_user
    req.basic_auth es_creds["username"], es_creds["password"]
  end

  res = Net::HTTP.start(host, port, :use_ssl => config[:elasticsearch_protocol] == 'https') do |http|
    http.request(req)
  end

  if res.code == '200'
    puts "Deleted Elasticsearch index: #{config[:elasticsearch_index]}"
  else
    data = JSON.load(res.body)
    if data['error']['type'] == 'index_not_found_exception'
      puts "Delete failed. Elasticsearch index (#{config[:elasticsearch_index]}) does not exist."
    else
      raise res.body
    end
  end
end


###############################################################################
# load_es_bulk_data
###############################################################################

desc "Load the collection data into the Elasticsearch index"
task :load_es_bulk_data, [:es_user] do |t, args|
  args.with_defaults(
    :es_user => nil,
  )

  # If es_user was specified, target the production ES server.
  env = if args.es_user != nil then :PRODUCTION_PREVIEW else :DEVELOPMENT end
  config = load_config env

  protocol = config[:elasticsearch_protocol]
  host = config[:elasticsearch_host]
  port = config[:elasticsearch_port]
  path = "/_bulk"
  req = Net::HTTP::Post.new(path, initheader = { 'Content-Type' => 'application/x-ndjson' })

  # Get the local ES config file location from the development config.
  dev_config = load_config :DEVELOPMENT

  # If an Elasticsearch user was specified, use their credentials to configure
  # basic auth.
  if args.es_user != nil
    es_creds = get_es_user_credentials args.es_user
    req.basic_auth es_creds["username"], es_creds["password"]
  end

  req.body = File.open(File.join([dev_config[:elasticsearch_dir], $ES_BULK_DATA_FILENAME]), 'rb').read

  res = Net::HTTP.start(host, port, :use_ssl => config[:elasticsearch_protocol] == 'https') do |http|
    http.request(req)
  end

  if res.code != '200'
    raise res.body
  end
  puts "Loaded data into Elasticsearch"
end


###############################################################################
# setup_elasticsearch
###############################################################################

task :setup_elasticsearch do
  Rake::Task['extract_pdf_text'].invoke
  Rake::Task['generate_es_bulk_data'].invoke
  Rake::Task['generate_es_index_settings'].invoke

  # Wait for the Elasticsearch instance to be ready.
  config = load_config :DEVELOPMENT
  while ! elasticsearch_ready config
    puts 'Waiting for Elasticsearch... Is it running?'
    sleep 2
  end

  # TODO - figure out why the index mapping in not right when these two tasks
  # (create_es_index, load_es_bulk_data) are executed within this task but work
  # fine when executed individually using rake.
  Rake::Task['create_es_index'].invoke
  Rake::Task['load_es_bulk_data'].invoke
end


###############################################################################
# sync_objects
#
# Upload objects from your local objects/ dir to a Digital Ocean Space or other
# S3-compatible storage.
# For information on how to configure your credentials, see:
# https://docs.aws.amazon.com/sdk-for-ruby/v3/developer-guide/setup-config.html#aws-ruby-sdk-credentials-shared
#
###############################################################################

task :sync_objects, [ :aws_profile ] do |t, args |
  args.with_defaults(
    :aws_profile => "default"
  )

  # Get the local objects directories from the development configuration.
  dev_config = load_config :DEVELOPMENT
  objects_dir = dev_config[:objects_dir]
  thumb_images_dir = dev_config[:thumb_images_dir]
  small_images_dir = dev_config[:small_images_dir]

  # Get the remove objects URL from the production configuration.
  s3_url = load_config(:PRODUCTION_PREVIEW)[:remote_objects_url]

  # Derive the S3 endpoint from the URL, with the expectation that it has the
  # format: <protocol>://<bucket-name>.<region>.cdn.digitaloceanspaces.com[/<prefix>]
  # where the endpoint will be: <region>.digitaloceanspaces.com
  REGEX = /^https?:\/\/(?<bucket>[^\.]+)\.(?<region>\w+)(?:\.cdn)?\.digitaloceanspaces\.com(?:\/(?<prefix>.+))?$/
  match = REGEX.match s3_url
  if !match
    puts "digital-objects URL \"#{s3_url}\" does not match the expected "\
         "pattern: \"#{REGEX}\""
    next
  end
  bucket = match[:bucket]
  region = match[:region]
  prefix = match[:prefix]
  endpoint = "https://#{region}.digitaloceanspaces.com"

  # Create the S3 client.
  credentials = Aws::SharedCredentials.new(profile_name: args.aws_profile)
  s3_client = Aws::S3::Client.new(
    endpoint: endpoint,
    region: region,
    credentials: credentials
  )

  # Iterate over the object files and put each into the remote bucket.
  num_objects = 0
  [ objects_dir, thumb_images_dir, small_images_dir ].each do |dir|
    # Enforce a requirement by the subsequent object key generation code that each
    # enumerated directory path starts with objects_dir.
    if !dir.start_with? objects_dir
      raise "Expected dir to start with \"#{objects_dir}\", got: \"#{dir}\""
    end

    Dir.glob(File.join([dir, '*'])).each do |filename|
      # Ignore subdirectories.
      if File.directory? filename
        next
      end

      # Generate the remote object key using any specified digital-objects prefix and the
      # location of the local file relative to the objects dir.
      key = "#{prefix}/#{dir[objects_dir.length..]}/#{File.basename(filename)}"
              .gsub('//', '/')
              .delete_prefix('/')

      puts "Uploading \"#{filename}\" as \"#{key}\"..."
      s3_client.put_object(
        bucket: bucket,
        key: key,
        body: File.open(filename, 'rb'),
        acl: 'public-read'
      )

      num_objects += 1
    end
  end

  puts "Uploaded #{num_objects} objects"

end
