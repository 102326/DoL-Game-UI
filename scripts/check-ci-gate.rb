#!/usr/bin/env ruby
# Execute the actual workflow gate shell, so skipping/failing validate cannot look green.
require 'yaml'
require 'open3'
root = File.expand_path('..', __dir__)
workflow = YAML.safe_load(File.read(File.join(root, '.github/workflows/build.yml')), permitted_classes: [], aliases: false)
gate = workflow.fetch('jobs').fetch('moody-gate')
raise 'gate must always run after validate' unless gate['needs'] == 'validate' && gate['if'] == '${{ always() }}'
raise 'gate result must come from needs.validate.result' unless gate.dig('steps', 0, 'env', 'VALIDATE_RESULT') == '${{ needs.validate.result }}'
script = gate.fetch('steps').fetch(0).fetch('run')
%w[success failure skipped cancelled neutral timed_out unknown].push('').each do |result|
  output, status = Open3.capture2e({'VALIDATE_RESULT'=>result}, 'bash', '-e', '-o', 'pipefail', '-c', script)
  raise "gate accepted/rejected wrong result #{result.inspect}: #{output}" unless status.success? == (result == 'success')
end
puts 'PASS: actual CI gate accepts success only; failure/skip/cancel/neutral/timeout/missing rejected'
