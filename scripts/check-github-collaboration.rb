#!/usr/bin/env ruby
# Scoped checks for MB-GH-01's native input/textarea/dropdown forms, not GitHub's server validator.
require 'yaml'
require 'json'

module GithubCollaboration
  REQUIRED = {
    'bug-report.yml' => %w[actual expected steps],
    'compatibility-request.yml' => %w[mod-name requested-support use-case],
    'compatibility-bug.yml' => %w[mod-name actual steps],
    'feature-request.yml' => %w[problem feature],
    'ui-ux-feedback.yml' => %w[page problem ideal],
    'engineering.yml' => %w[actual expected]
  }.freeze
  PR_HEADINGS = ['变更内容（Changes）', '关联问题（Related Issues）', '验证结果（Validation）',
                 '兼容影响（Compatibility Impact）', '回退说明（Rollback）', '限制与已知问题（Limitations）'].freeze

  def self.check(condition, message)
    raise ArgumentError, message unless condition
  end

  def self.text?(value)
    value.is_a?(String) && !value.strip.empty?
  end

  def self.bilingual?(value)
    text?(value) && value.match?(/\p{Han}/) && value.match?(/[A-Za-z]/)
  end

  def self.form!(form, filename)
    check(form.is_a?(Hash), "#{filename}: expected mapping")
    check((form.keys - %w[name description title labels body]).empty?, "#{filename}: unknown top-level key")
    %w[name description title].each { |k| check(bilingual?(form[k]), "#{filename}: missing bilingual #{k}") }
    labels = form.fetch('labels', [])
    check(labels.is_a?(Array) && labels.all? { |s| text?(s) } && labels.uniq == labels, "#{filename}: invalid labels")
    body = form['body']
    check(body.is_a?(Array) && !body.empty?, "#{filename}: missing body")
    ids, required = [], []
    body.each do |field|
      check(field.is_a?(Hash) && (field.keys - %w[type id attributes validations]).empty?, "#{filename}: invalid element")
      type, attrs = field.values_at('type', 'attributes')
      check(attrs.is_a?(Hash), "#{filename}: missing attributes")
      if type == 'markdown'
        check(attrs.keys == ['value'] && bilingual?(attrs['value']), "#{filename}: invalid bilingual notice")
        check(!field.key?('validations'), "#{filename}: markdown has validations")
        next
      end
      check(%w[input textarea dropdown].include?(type), "#{filename}: unsupported element type")
      id = field['id']
      check(text?(id) && id.match?(/\A[a-zA-Z0-9_-]+\z/) && !ids.include?(id), "#{filename}: invalid or duplicate ID #{id}")
      ids << id
      check(bilingual?(attrs['label']), "#{filename}/#{id}: missing bilingual label")
      keys = type == 'dropdown' ? %w[label description options default multiple] : %w[label description placeholder value render]
      check((attrs.keys - keys).empty?, "#{filename}/#{id}: unknown attribute")
      %w[description placeholder value render].each { |k| check(text?(attrs[k]), "#{filename}/#{id}: invalid #{k}") if attrs.key?(k) }
      validations = field['validations']
      check(validations.is_a?(Hash) && validations.keys == ['required'] && [true, false].include?(validations['required']), "#{filename}/#{id}: required must be boolean")
      required << id if validations['required']
      if type == 'dropdown'
        options = attrs['options']
        check(options.is_a?(Array) && !options.empty? && options.all? { |s| text?(s) } && options.uniq == options, "#{filename}/#{id}: invalid options")
        check(!attrs.key?('default') || (attrs['default'].is_a?(Integer) && (0...options.length).cover?(attrs['default'])), "#{filename}/#{id}: invalid default")
      end
      if id.include?('version')
        check(!validations['required'] && attrs.values.grep(String).any? { |s| s.include?('Unknown') }, "#{filename}/#{id}: unknown version must be allowed")
      end
      check(!attrs.key?('render'), "#{filename}/#{id}: attachments require Markdown-enabled textarea") if id == 'evidence'
    end
    check(required.sort == REQUIRED.fetch(filename).sort, "#{filename}: required fields exceed or miss player essentials")
    check(!form['body'].any? { |f| %w[evidence screen-info comparison].include?(f['id']) && f.dig('validations', 'required') }, "#{filename}: optional evidence/device/comparison made required")
    form
  end

  def self.validate(root)
    directory = File.join(root, '.github/ISSUE_TEMPLATE')
    check(Dir.children(directory).sort == (REQUIRED.keys + ['config.yml']).sort, 'Expected six forms and config.yml')
    forms = REQUIRED.keys.to_h do |name|
      data = YAML.safe_load(File.read(File.join(directory, name), encoding: 'UTF-8'), permitted_classes: [], aliases: false)
      [name, form!(data, name)]
    end
    check(forms.values.map { |f| f['name'] }.uniq.length == forms.length, 'Duplicate form names')
    config = YAML.safe_load(File.read(File.join(directory, 'config.yml')), permitted_classes: [], aliases: false)
    check(config == { 'blank_issues_enabled' => true }, 'Keep blank issues available; no new contact/automation routes')
    pr = File.read(File.join(root, '.github/pull_request_template.md'), encoding: 'UTF-8')
    check(pr.lines.grep(/^## /).map { |s| s.delete_prefix('## ').strip } == PR_HEADINGS, 'PR template headings missing or out of order')
    forms
  end
end

if $PROGRAM_NAME == __FILE__
  begin
    as_json = ARGV.delete('--json')
    forms = GithubCollaboration.validate(ARGV.shift || File.expand_path('..', __dir__))
    puts(as_json ? JSON.pretty_generate(forms) : "PASS: six bilingual forms, native field structure, optional technical evidence, blank issue route, six PR sections")
  rescue StandardError => error
    warn "FAIL: #{error.message}"
    exit 1
  end
end
