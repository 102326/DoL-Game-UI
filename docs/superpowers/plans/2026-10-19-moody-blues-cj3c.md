# Moody Blues CJ-3C 制品合同增强

授权：2026-10-19 总指令V1.0。P0/协作PR首次检查之后实施；独立分支依赖P0，不改已发布ZIP、main、保护规则或CD。

1. 保留UI/Host独立政策值与现有ZIP字节/许可证/依赖检查。增加根package版本、官方wrapper运行版本、包生产脚本、Host包/协议/依赖范围的交叉核对；旧src/main.ts2.7入口不强行替换。
2. 固定六个当前可选包身份/依赖/入口/文件政策，验证源Manifest与实际ZIP，拒绝生产/校验共读被改坏的Manifest后自证；旧Lyra0.5.11.9路径不得纳入CI。
3. 复用现有打包器，adapter改按排序的bytes写固定ZipInfo，明确时间/压缩/权限/system/extra/comment策略；不承诺跨OS/zlib相同ZIP字节。
4. 复用现有构建命令生成八个候选包，两轮各使用新的生成输出；第一轮立即冻结ZIP bytes、成员/metadata/hash，再执行第二轮，精确报告内容/metadata/ZIP差异。只处理明确的生成目录，不删除既有日志或其它输出。
5. 使用unittest实际ZIP反例：版本及双源错配、依赖/入口/license/字节、缺失/多余/不安全/重复成员、metadata及比较器反例，mtime改变后结果相同。保持原测试反例metadata有效，防止被错误断言提前截获。
6. CJ-3A增加受控且有上限的制品报告；包装阶段需要完整版本/八包/两次构建证据才PASS。原业务/历史/布局矩阵不扩大。
7. 本机跑相关红绿验证、完整七阶段及GitHubActions；独立审阅；提交推送CJ3C分支，不自动创建第三PR或合并。记录实际成本、运行身份、报告上限、Windows/实机未验证。

CJ-4只读调查规则/保护/检查名/bypass/合并策略并给建议，不做远端配置写入。更新HANDOFF三个部分和完整交付报告。
