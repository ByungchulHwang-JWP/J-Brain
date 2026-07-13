---
title: "AI 멀티 에이전트 아키텍처 (G-Stack & Superpowers) 워크플로우 및 사용법"
track: knowledge
category: architecture-patterns
problem_type: workflow-setup
tags:
  - gstack
  - superpowers
  - compound-engineering
  - agent-workflow
---

## 배경 (Context)
기획(G-Stack)부터 격리된 환경에서의 실제 구현(Superpowers), 그리고 지식 저장(Compound Engineering)까지 체계적으로 작업을 수행하기 위해 AI 멀티 에이전트 아키텍처를 도입했습니다. 프로젝트를 통제하고 품질을 극대화하기 위해 각 에이전트 스킬들을 정해진 순서대로 호출하는 표준 운영 절차(SOP)가 필요합니다.

## G-Stack 및 Superpowers 사용법 (Guidance)
AI 멀티 에이전트 아키텍처를 완벽하게 통제하기 위해 다음의 6단계 순서대로 에이전트 스킬을 호출하여 사용합니다.

### 1단계: 기획 및 방향성 검증 (G-Stack)
G-Stack은 전략적 기획자(Strategic Planner) 역할을 합니다.
1. **`office-hours` 스킬**:
   - **용도**: 초기 아이디어를 검증하고 비판적인 질문 받기.
   - **사용법**: "office-hours 스킬로 내 새로운 앱 아이디어를 검증해줘. 아이디어는 ~야."
2. **`plan-ceo-review` 스킬**:
   - **용도**: CEO 관점에서 비즈니스 가치를 판단하고 오버스펙을 방지하기.
   - **사용법**: "이 아이디어를 plan-ceo-review 스킬로 전략적 관점에서 검토해줘."
3. **`plan-eng-review` 스킬**:
   - **용도**: 수석 엔지니어 관점에서 기술적 아키텍처, 엣지 케이스 및 데이터베이스 구조 검토하기.
   - **사용법**: "plan-eng-review 스킬로 기술적인 아키텍처를 검토해줘."

### 2단계: 실제 구현 및 실행 (Superpowers)
Superpowers는 격리된 실행자(Isolated Executor) 역할을 합니다.
4. **`brainstorming` 스킬**:
   - **용도**: 정리된 기획을 바탕으로 구체적인 코드 구현 방안과 아키텍처를 브레인스토밍하기.
   - **사용법**: "brainstorming 스킬을 써서 구체적인 구현 방안을 짜보자."
5. **`subagent-driven-development` 스킬** (선택사항):
   - **용도**: 복잡한 태스크를 격리된 공간의 하위 에이전트(Sub-agent)들에게 분할하여 병렬로 개발하기.
   - **사용법**: "이 계획을 subagent-driven-development 스킬로 개발 진행해줘."

### 3단계: 지식 복리화 (Compound Engineering)
6. **`ce-compound` 스킬**:
   - **용도**: 개발 완료 후 배운 지식, 겪은 문제, 해결책 등을 `docs/solutions/`에 파일로 영구 기록하여 다음 에이전트가 참고할 수 있게 하기.
   - **사용법**: "오늘 배운 내용(또는 해결한 문제)을 ce-compound 스킬로 기록해줘."

## 도입 효과 (Why This Matters)
이러한 계층형 워크플로우는 기획과 실행을 분리하여 안정성을 높입니다. 코드를 작성하기 전에 기획과 아키텍처를 뾰족하게 검증하여 불필요한 작업(Wasted effort)을 방지하고, 작업이 끝난 후에는 배운 점을 파일로 기록해 둠으로써 팀과 에이전트의 지식이 복리로 쌓이게(Knowledge compounding) 됩니다.

## 적용 시점 (When to Apply)
- 새로운 기능이나 프로젝트를 시작할 때
- 복잡한 아키텍처 변경을 계획할 때
- 해결하기 까다로운 버그나 이슈를 분석하고 기록할 때

## 예시 (Examples)
- **신규 아이디어 구상 시**: `office-hours` 스킬을 호출하여 아이디어를 다듬고, 이어서 `plan-ceo-review`를 호출하여 기획을 확정합니다.
- **작업 종료 시**: `ce-compound` 스킬을 호출하여 해결책을 `docs/solutions/` 하위에 문서로 저장합니다.
