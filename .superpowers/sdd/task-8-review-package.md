 .superpowers/sdd/progress.md                       |  2 +
 backend/src/app.module.ts                          | 12 ++++
 backend/src/modules/appeal/appeal.controller.ts    | 29 +++++++++
 backend/src/modules/appeal/appeal.module.ts        | 14 +++++
 backend/src/modules/appeal/appeal.service.ts       | 41 +++++++++++++
 .../src/modules/appeal/dto/create-appeal.dto.ts    | 25 ++++++++
 .../src/modules/appeal/dto/update-appeal.dto.ts    |  4 ++
 .../src/modules/appeal/entities/appeal.entity.ts   | 23 ++++++++
 .../src/modules/case-file/case-file.controller.ts  | 58 ++++++++++++++++++
 backend/src/modules/case-file/case-file.module.ts  | 13 +++++
 backend/src/modules/case-file/case-file.service.ts | 63 ++++++++++++++++++++
 .../modules/case-file/dto/create-case-file.dto.ts  | 37 ++++++++++++
 .../modules/case-file/dto/update-case-file.dto.ts  |  4 ++
 .../modules/case-file/entities/case-file.entity.ts | 30 ++++++++++
 backend/src/modules/court/court.controller.ts      | 49 ++++++++++++++++
 backend/src/modules/court/court.module.ts          | 14 +++++
 backend/src/modules/court/court.service.ts         | 51 ++++++++++++++++
 backend/src/modules/court/dto/create-court.dto.ts  | 18 ++++++
 backend/src/modules/court/dto/update-court.dto.ts  |  4 ++
 backend/src/modules/court/entities/court.entity.ts | 17 ++++++
 .../fee-tracking/dto/create-fee-tracking.dto.ts    | 38 ++++++++++++
 .../fee-tracking/dto/update-fee-tracking.dto.ts    |  4 ++
 .../fee-tracking/entities/fee-tracking.entity.ts   | 32 ++++++++++
 .../fee-tracking/fee-tracking.controller.ts        | 34 +++++++++++
 .../modules/fee-tracking/fee-tracking.module.ts    | 14 +++++
 .../modules/fee-tracking/fee-tracking.service.ts   | 52 +++++++++++++++++
 backend/src/modules/party/dto/create-party.dto.ts  | 56 ++++++++++++++++++
 backend/src/modules/party/dto/update-party.dto.ts  |  4 ++
 backend/src/modules/party/entities/party.entity.ts | 47 +++++++++++++++
 backend/src/modules/party/party.controller.ts      | 39 +++++++++++++
 backend/src/modules/party/party.module.ts          | 13 +++++
 backend/src/modules/party/party.service.ts         | 68 ++++++++++++++++++++++
 .../dto/create-service-record.dto.ts               | 30 ++++++++++
 .../dto/update-service-record.dto.ts               |  4 ++
 .../service-record/dto/update-status.dto.ts        |  7 +++
 .../entities/service-record.entity.ts              | 26 +++++++++
 .../service-record/service-record.controller.ts    | 35 +++++++++++
 .../service-record/service-record.module.ts        | 13 +++++
 .../service-record/service-record.service.ts       | 61 +++++++++++++++++++
 .../user-court/entities/user-court.entity.ts       | 12 ++++
 40 files changed, 1097 insertions(+)
2240ebe feat: add Court, CaseFile, Party, ServiceRecord, Appeal, FeeTracking CRUD modules
7065ac0 fix: add TenantModule import to CourthouseModule
cfdf3b9 feat: add Courthouse CRUD with auto tenant schema creation
