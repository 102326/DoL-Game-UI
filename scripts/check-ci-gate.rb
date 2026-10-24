#!/usr/bin/env ruby
# Execute the actual workflow gate shell, so skipping/failing validate cannot look green.
require 'yaml'
require 'open3'
require 'json'
root = File.expand_path('..', __dir__)
node_version=File.read(File.join(root,'.node-version')).strip
raise 'Node26 patch baseline changed without review' unless node_version == '26.12.1'
raise 'Node26 Only engine range mismatch' unless JSON.parse(File.read(File.join(root,'package.json'))).dig('engines','node') == ">=#{node_version} <27"
workflow = YAML.safe_load(File.read(File.join(root, '.github/workflows/build.yml')), permitted_classes: [], aliases: false)
gate = workflow.fetch('jobs').fetch('moody-gate')
raise 'gate must always run after validate' unless gate['needs'] == ['validate','evidence-verify'] && gate['if'] == '${{ always() }}'
raise 'gate result must come from needs.validate.result' unless gate.dig('steps', 0, 'env', 'VALIDATE_RESULT') == '${{ needs.validate.result }}'
script = gate.fetch('steps').fetch(0).fetch('run')
%w[success failure skipped cancelled neutral timed_out unknown].push('').each do |result|
  output, status = Open3.capture2e({'VALIDATE_RESULT'=>result,'EVIDENCE_RESULT'=>'success'}, 'bash', '-e', '-o', 'pipefail', '-c', script)
  raise "gate accepted/rejected wrong result #{result.inspect}: #{output}" unless status.success? == (result == 'success')
end
%w[failure skipped cancelled neutral timed_out unknown].push('').each do |result|
 output,status=Open3.capture2e({'VALIDATE_RESULT'=>'success','EVIDENCE_RESULT'=>result},'bash','-e','-o','pipefail','-c',script)
 raise "gate accepted incomplete remote evidence #{result.inspect}" if status.success?
end
%w[build.yml golden-spin-prototype.yml].each do |file|
 w=YAML.safe_load(File.read(File.join(root,'.github/workflows',file)), permitted_classes: [], aliases: false)
 node_steps=w.fetch('jobs').values.flat_map{|j|j.fetch('steps',[])}.select{|s|s['uses'].to_s.start_with?('actions/setup-node@')}
 raise "Node26 setup missing or inconsistent: #{file}" unless node_steps.length==2 && node_steps.all?{|s|s.dig('with','node-version-file')=='.node-version' && !s.fetch('with').key?('node-version')}
 producer=file=='build.yml' ? 'validate' : 'prototype'
 concurrency=w.fetch('concurrency')
 raise "event/manual concurrency collision: #{file}" unless concurrency['group'].include?('github.event_name') && concurrency['group'].include?('github.run_id')
 raise "main push may be cancelled: #{file}" unless concurrency['cancel-in-progress'].include?("github.ref != 'refs/heads/main'")
 remote=w.fetch('jobs').fetch('evidence-verify')
 raise "remote gate can skip: #{file}" unless remote['if']=='${{ always() }}' && remote['needs']==producer
 expected='${{ needs.'+producer+'.outputs.evidence_upload }}'
 raise "upload outcome not anchored: #{file}" unless remote.dig('env','MOODY_UPLOAD_OUTCOME')==expected
 verify=remote.fetch('steps').find{|s|s['name']=='Verify actual downloaded evidence'}
 raise "download failure skips verifier: #{file}" unless verify && verify['if']=='always()' && verify.dig('env','MOODY_DOWNLOAD_OUTCOME')=='${{ steps.evidence-download.outcome }}'
 upload=w.fetch('jobs').fetch(producer).fetch('steps').find{|s|s['id']=='evidence-upload'}
 raise "missing actual upload: #{file}" unless upload && upload['if']=='always()'
end
%w[build packages browser-install browser build-artifacts].each do |id|
 step=workflow.fetch('jobs').fetch('validate').fetch('steps').find{|s|s['id']==id}
 raise "independent stage uses implicit success(): #{id}" unless step && step['if'].include?('!cancelled()')
end
puts 'PASS: actual CI gate accepts success only; failure/skip/cancel/neutral/timeout/missing rejected'
