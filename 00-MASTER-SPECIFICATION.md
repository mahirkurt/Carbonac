# MACULOGIC: SİSTEM MİMARİSİ VE ENTEGRASYON KILAVUZU (MASTER SPECIFICATION)

> **Versiyon:** 7.2.1 (Part G Harmonization)
> **Son Güncelleme:** 2026-01-02  
> **Rol:** Proje Anayasası ve Kaynak Otorite  
> **Statü:** **SOURCE OF TRUTH** - Tüm çelişki durumlarında bu belge esastır

---

## 🔗 İlişkili Dokümantasyon

| #      | Dosya                                                    | Rol          | Açıklama                                          |
| ------ | -------------------------------------------------------- | ------------ | ------------------------------------------------- |
| **00** | **Bu dosya**                                             | 📍 Ana Beyin  | Veri modelleri, domain kuralları, SOURCE OF TRUTH |
| 01     | [01-ENGINEERING-GUIDE.md](./01-ENGINEERING-GUIDE.md)     | Mühendislik  | Electron, klasör yapısı, IPC, SQLite              |
| 02     | [02-CLINICAL-ONTOLOGY.md](./02-CLINICAL-ONTOLOGY.md)     | Tanı         | Hastalık grupları A-H                             |
| 03     | [03-CASE-GROUPS.md](./03-CASE-GROUPS.md)                 | Workflow     | 10 Case grubu                                     |
| 04     | [04-ENCOUNTER-TYPES.md](./04-ENCOUNTER-TYPES.md)         | Operasyon    | 9 Encounter tipi                                  |
| 05     | [05-CLINICAL-ALGORITHMS.md](./05-CLINICAL-ALGORITHMS.md) | Algoritma    | Wizard akışları, MDS                              |
| 06     | [06-DESIGN-SYSTEM.md](./06-DESIGN-SYSTEM.md)             | Tasarım      | UI/UX, OKLCH, MD3 token'lar                       |
| 07     | [07-PROJECT-PHASES-PLAN.md](./07-PROJECT-PHASES-PLAN.md) | Yol Haritası | Faz bazlı geliştirme planı                        |

---

## 🤖 AI Agent Kullanım Kılavuzu

**Bu dosyayı kullan:**
- Projeye yeni başlarken
- Veri modellerini (TypeScript interface) araştırırken
- Entity ilişkilerini öğrenirken
- "Hangi bilgi nerede?" sorusuna cevap ararken

**Diğer dosyalara git:**
- Kod mimarisi için → `01-ENGINEERING-GUIDE.md`
- Ontoloji/tanı için → `02-CLINICAL-ONTOLOGY.md`
- Case grupları için → `03-CASE-GROUPS.md`
- Encounter tipleri için → `04-ENCOUNTER-TYPES.md`
- Wizard akışları için → `05-CLINICAL-ALGORITHMS.md`
- UI/UX token'ları için → `06-DESIGN-SYSTEM.md`
- Faz planlaması için → `07-PROJECT-PHASES-PLAN.md`

**KESİN KURALLAR:**
- Hiçbir zaman hardcoded değer kullanmayın. Her zaman referans belgelerdeki token/enum/type'ları kullanın.
- UI metinlerini hiçbir zaman hardcoded yazmayın. Her zaman `t()` fonksiyonu ile i18n kullanın.

**i18n (Çoklu Dil):** Türkçe (varsayılan) ve English desteklenir. Detay için bkz. [01-ENGINEERING-GUIDE.md](./01-ENGINEERING-GUIDE.md) §3.4

---

## BÖLÜM 1: PROJE VİZYONU VE TEMEL İLKELER

### 1.1 "Retina Açığı" (The Retina Gap)

Genel amaçlı HBYS sistemleri, retina pratiğinin üç kritik gereksiniminde başarısız olur:

| Sorun                     | Etki                                                                                 | Maculogic Çözümü                                              |
| ------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| **Veri Yoksulluğu**       | OCT'den gelen "CST: 325µm" gibi kantitatif veri, "Makula ödemi var" metnine indirgen | Yapılandırılmış alanlar: `IRF: Bool`, `SRF: Bool`, `CST: Int` |
| **Görüntüleme Kopukluğu** | Gigabaytlarca görüntü ya kaybolur ya sıkıştırılır                                    | Hot Folder + Sharp.js + Thumbnail Cache                       |
| **İş Akışı Sürtünmesi**   | "Gör-Karar Ver-Enjekte Et" döngüsü için 20+ tıklama                                  | Smart Wizard: 3 adımda tamamlanır                             |

### 1.2 Dört Temel İlke (The Four Pillars)

```
┌───────────────────────────────────────────────────────────┐
│ 1. EYE-FIRST DATA MODEL                                  │
│    Patient → Eye (OD/OS) → Case/Episode → Encounter      │
│    Her göz bağımsız bir zaman çizelgesidir.              │
│    Case/Episode: Hastalık süreci (fiziksel tablo, N:N)   │
├───────────────────────────────────────────────────────────┤
│ 2. LOCAL SOVEREIGNTY (Offline-First)                     │
│    SQLite + SQLCipher (AES-256)                          │
│    Tüm veri hekimin NVMe SSD'sindedir.                   │
├───────────────────────────────────────────────────────────┤
│ 3. FLUENT MEDICAL UX                                      │
│    MD3 Expressive + Microsoft Fluent Fusion              │
│    Mica, Acrylic, Spring Physics, Teal/Coral palette     │
├───────────────────────────────────────────────────────────┤
│ 4. RESEARCH-READY                                         │
│    ICD-11, logMAR, FARTURK uyumlu yapilandirilmis veri   │
│    Tek tıkla anonim CSV/Parquet export                   │
└───────────────────────────────────────────────────────────┘
```

---

## BÖLÜM 2: VERİ MİMARİSİ (DATA ARCHITECTURE)

*Tüm varlık isimleri, alan adları ve enum değerleri bu bölümde tanımlanmıştır. Kod yazarken bu isimleri birebir kullanın.*

### 2.1 Temel Varlıklar (Core Entities)

#### A. Patient (Hasta - Root Level)

```typescript
interface Patient {
  // === PRIMARY KEY ===
  PatientUUID: string;          // V4 UUID, immutable
  CaseCode: string;             // "M-2025-0123" (sequential anonymous)

  // === IDENTITY ===
  FullName: string;
  DateOfBirth: Date;
  Gender: 'M' | 'F' | 'Other';
  NationalID?: string;          // Encrypted in SQLCipher, masked in UI (***1234)

  // === SYSTEMIC RISKS ===
  DiabetesType?: 'Type1' | 'Type2' | 'None';
  DiabetesDuration?: number;    // Years
  HbA1c?: number;               // Percentage
  HbA1cDate?: Date;
  Hypertension: boolean;
  RenalStatus?: 'Normal' | 'CKD' | 'Dialysis';
  AnticoagulantDrug?: string;   // "Coumadin 5mg" etc.

  // === ALLERGIES ===
  KnownAllergies: string[];     // ["Fluorescein", "Iodine"]

  // === COMPLIANCE ===
  KVKKConsent: boolean;
  ConsentDate?: Date;
}
```

#### B. Eye (Göz - Second Level)

```typescript
interface Eye {
  EyeUUID: string;
  PatientID: string;            // FK → Patient.PatientUUID
  Laterality: 'OD' | 'OS';      // RIGHT or LEFT

  // === ANATOMICAL ===
  AxialLength?: number;         // mm (for myopia tracking)
  LensStatus: 'Phakic' | 'Pseudophakic-Monofocal' | 'Pseudophakic-Toric' | 'Aphakic';
  IOLType?: string;             // If pseudophakic

  // === BASELINE ===
  BaselineVA?: number;          // logMAR at first visit
  BaselineDate?: Date;
}
```

#### C. Case/Episode (Klinik Vaka - Third Level)

**Klinik Tanım:**

> Case/Episode, göz (Eye) bazında **tek bir hastalık süreci veya iş akışı bağlamını** temsil eder.
> Aynı göz için birden fazla Case olabilir (örn: nAMD Case + Post-op ERM Case).
> Detaylı Case tanımları için bkz. [03-CASE-GROUPS.md](./03-CASE-GROUPS.md)

```typescript
interface CaseEpisode {
  CaseUUID: string;
  EyeID: string;                // FK → Eye.EyeUUID
  
  // === CASE IDENTITY ===
  CaseGroupID: number;          // 1-10 arası (bkz. 03-CASE-GROUPS.md)
  PrimaryDiagnosis: string;     // RetinaConcept code (bkz. 02-CLINICAL-ONTOLOGY.md)
  
  // === STATUS ===
  Status: 'Active' | 'Monitoring' | 'Resolved' | 'Referred';
  OpenedDate: Date;
  ClosedDate?: Date;
  
  // === TREATMENT CONTEXT ===
  TreatmentRegimen?: 'T&E' | 'PRN' | 'Fixed' | 'Observation';
  CurrentIntervalWeeks?: number;  // T&E için mevcut aralık
}
```

**Hiyerarşi:**

```
Patient (Hasta)
  └─→ Eye (OD/OS)
        └─→ Case/Episode (Hastalık bağlamı, örn: "nAMD T&E")
              └─→ Encounter (Vizit, örn: "2025-01-15 Injection")
```

#### D. Encounter (Vizit/Muayene)

**Klinik Tanım:**

> Encounter.Type, göz bazlı atomik klinik olay için **operasyonel akış şablonunu** belirler.
> "Bugün ne yapıldı?" sorusunun cevabı **Type'tan** değil, **InjectionRecord/Procedure** kayıtlarından türetilmelidir.
> Detaylı klinik rehber için bkz. [04-ENCOUNTER-TYPES.md](./04-ENCOUNTER-TYPES.md)

```typescript
interface Encounter {
  EncounterUUID: string;
  EyeID: string;                // FK → Eye.EyeUUID
  DateTime: Date;
  Type: 'Routine' | 'Injection' | 'Laser' | 'Surgery' | 'PostOp' | 'Emergency' | 'Examination' | 'Imaging' | 'Consult';

  // === BILATERAL LINK ===
  BilateralLinkID?: string;     // If same-day procedure on both eyes
  
  // === PROCEDURE CODE ===
  ProcedureCode?: string;       // SGK/SUT code
  
  // === POSTOP SURGERY LINK (MVP: UI selection, Phase 2+: FK) ===
  // LinkedSurgeryID?: string;  // FK → Surgery Encounter (planned)
  
  // === VISIT CONTEXT (Phase 2+ consideration) ===
  // IsEmergency?: boolean;     // Emergency flag independent of Type
  // VisitContext?: 'Scheduled' | 'WalkIn' | 'Emergency';
}
```

**Type Kullanım Kuralları:**

| Type      | Klinik Bağlam                     | Güvenlik Kontrolü      |
| --------- | --------------------------------- | ---------------------- |
| Routine   | Planlı muayene, OCT değerlendirme | Standart MDS           |
| Injection | IVI odaklı (hız + güvenlik)       | Laterality + Lot/SKT   |
| Laser     | PRP, fokal, retinopeksi           | Laterality             |
| Surgery   | PPV, SB, kombine prosedürler      | Laterality + Onay      |
| PostOp    | Cerrahi sonrası kontrol           | Linked Surgery         |
| Emergency | Acil/plansız başvuru              | Semptom zamanı zorunlu |

> **[!TIP]**
> Emergency Type, prosedür belirtmez; triage/öncelik bağlamı taşır.
> Acil vizitte lazer yapıldıysa Type=Laser seçilmeli, acil bağlam not/etiket olarak korunmalıdır.

### 2.2 Yapılandırılmış Hastalık Modelleri

*(Bu bölüm [05-CLINICAL-ALGORITHMS.md](./05-CLINICAL-ALGORITHMS.md) ve [02-CLINICAL-ONTOLOGY.md](./02-CLINICAL-ONTOLOGY.md) ile tam uyumludur)*

#### nAMD (Neovascular AMD)

```typescript
interface DiagnosisNAMD {
  DiagnosisID: string;
  EyeID: string;
  
  Subtype: 'Type1-Occult' | 'Type2-Classic' | 'Type3-RAP' | 'PCV' | 'Mixed';
  ActivityStatus: 'Active' | 'Inactive' | 'Scar';
  LesionLocation: 'Subfoveal' | 'Juxtafoveal' | 'Extrafoveal';
  
  FirstDiagnosisDate: Date;
}
```

#### DME (Diabetic Macular Edema)

```typescript
interface DiagnosisDME {
  DiagnosisID: string;
  EyeID: string;
  
  CenterInvolvement: boolean;   // CI-DME vs Non-CI
  DRStage: 'Mild-NPDR' | 'Moderate-NPDR' | 'Severe-NPDR' | 'PDR';
  IschemiaPresent: boolean;     // FAZ enlargement on OCTA
  
  FirstDiagnosisDate: Date;
}
```

#### RVO (Retinal Vein Occlusion)

```typescript
interface DiagnosisRVO {
  DiagnosisID: string;
  EyeID: string;
  
  Type: 'BRVO' | 'CRVO' | 'HRVO';
  PerfusionStatus: 'Perfused' | 'Ischemic' | 'Indeterminate';
  
  FirstDiagnosisDate: Date;
}
```

### 2.3 Tedavi ve Prosedür Kayıtları

#### Injection Record

```typescript
interface InjectionRecord {
  InjectionUUID: string;
  EncounterID: string;          // FK → Encounter
  
  // === DRUG ===
  Agent: 'Aflibercept-Eylea' | 'Faricimab-Vabysmo' | 'Ranibizumab-Lucentis' | 'Bevacizumab-Altuzan' | 'Dexamethasone-Ozurdex';
  LotNumber: string;            // Zorunlu - izlenebilirlik
  ExpirationDate: Date;         // Zorunlu - SKT kontrolü (>= today)
  
  // === TECHNIQUE ===
  InjectionSite: 'Superotemporal' | 'Inferonasal' | 'Other';
  Complications?: string;
  
  // === PROTOCOL (MVP: Manual entry) ===
  ProtocolPhase: 'Loading' | 'PRN' | 'T&E' | 'Fixed';
  CurrentInterval?: number;     // weeks (T&E only, 4-16)
  LastAction?: 'Extend+2w' | 'Extend+4w' | 'Shorten-4w' | 'Maintain'; // T&E only
  NextPlannedDate?: Date;       // bir sonraki kontrol / planlanan ziyaret
}
```

> [!NOTE]
> **İzlenebilirlik + Güvenlik (Phase 1 MVP):**
> - `LotNumber` ve `ExpirationDate` alanları **zorunludur**
> - SKT geçmiş ise kayıt **bloklanır** (UI + backend, hard error)
> - Wrong-site risk için laterality doğrulama **bloklayıcıdır**
> - Bkz. [04-ENCOUNTER-TYPES.md](./04-ENCOUNTER-TYPES.md) Güvenlik Kontrolleri

### 2.4 Görüntüleme (Imaging)

```typescript
interface ImagingFile {
  ImageUUID: string;
  EncounterID: string;
  
  // === FILE ===
  OriginalFileName: string;
  StoragePath: string;          // Relative to AppData
  FileType: 'DICOM' | 'JPEG' | 'TIFF' | 'PDF';
  FileSizeBytes: number;
  SHA256Hash: string;           // File integrity
  
  // === METADATA ===
  Modality: 'OCT' | 'OCTA' | 'FAF' | 'FA' | 'ICG' | 'ColorFundus' | 'USG';
  DeviceManufacturer?: string;  // "Heidelberg Spectralis"
  AcquisitionDate: Date;
  Laterality: 'OD' | 'OS';
  
  // === THUMBNAILS ===
  ThumbnailSmallPath?: string;  // 300px for list view
  ThumbnailLargePath?: string;  // 1080px for viewer
}
```

### 2.5 Veri İlişkileri (Entity Relationships)

```
Patient (1)
  └─> Eye (2)  [OD, OS]
        └─> Case/Episode (*)  [Hastalık süreci]
              └─> Encounter (*) via CaseEncounterLink [N:N ilişki]
                    ├─> Diagnosis (*) [nAMD, DME, RVO, etc.]
                    ├─> Finding (*) [VA, IOP, OCT Metrics]
                    ├─> Procedure (*) [Injection, Laser, Surgery]
                    └─> Imaging (*) [OCT, FA, Fundus]
```

**Kurallar:**
- Hiçbir clinical data doğrudan `Patient`'e bağlanmaz. Mutlaka `Eye → Case → Encounter` hiyerarşisinden geçer.
- Bir Encounter birden fazla Case ile ilişkilendirilebilir (N:N via `CaseEncounterLink`)
- Case/Episode: Fiziksel tablo (derived değil, bkz. § 2.6.3)

### 2.6 Veri Sözlüğü (Data Dictionary)

> **Tek Kaynak İlkesi:** Bu bölüm, 9 çekirdek tablonun **anlam, amaç ve alan kurallarını** tek bir yerde tanımlar.
> Klinik akış rehberi için bkz. [05-CLINICAL-ALGORITHMS.md](./05-CLINICAL-ALGORITHMS.md)

#### 2.6.0 Tanımlayıcı Terminolojisi (Identifier Terminology)

> **Önemli:** Aşağıdaki terimler farklı kavramları ifade eder ve karıştırılmamalıdır.

| Terim | İngilizce | Açıklama | Örnek |
|-------|-----------|----------|-------|
| `PatientFileNo` | Patient File Number | Klinikte fiziksel dosya numarası (kullanıcı tanımlı) | "2024-001234", "A-5678" |
| `CaseCode` | Case Code | Sistem tarafından üretilen vaka tanımlayıcısı | "C-2024-00001" |
| `*UUID` | Universally Unique ID | Primary Key, immutable, V4 UUID | "a1b2c3d4-..." |
| `*ID` | Foreign Key Reference | Başka tabloya referans | `PatientID`, `EyeID` |
| `RetinaConceptID` | Retina Concept ID | Tanı ontolojisi için immutable kurum içi kimlik | "RC-AMD-001" |

**Kurallar:**
1. **PatientFileNo** kullanıcı tarafından elle girilir veya klinik kurallarına göre otomatik üretilir.
2. **CaseCode** sistem tarafından yıl + sıra numarası formatında üretilir.
3. **UUID'ler** asla kullanıcıya gösterilmez; iç referans için kullanılır.
4. **RetinaConceptID** tanı katalogunda değişmez; isimler güncellenebilir.

#### 2.6.1 Patient (Hasta)

**Amaç:** Kimlik + sistemik risk profili + KVKK consent.

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| `PatientUUID` | string | ✅ | V4 UUID, immutable PK |
| `FullName` | string | ✅ | Ad soyad |
| `DateOfBirth` | Date | ✅ | Doğum tarihi |
| `Gender` | enum | ✅ | 'M' \| 'F' \| 'Other' |
| `Hypertension` | boolean | ✅ | Hipertansiyon varlığı |
| `KnownAllergies` | string[] | ✅ | Bilinen alerjiler listesi |
| `KVKKConsent` | boolean | ✅ | KVKK onay durumu |
| `DiabetesType` | enum | - | 'Type1' \| 'Type2' \| 'None' |
| `DiabetesDuration` | number | - | Yıl cinsinden |
| `HbA1c` | number | - | % değeri |
| `RenalStatus` | enum | - | 'Normal' \| 'CKD' \| 'Dialysis' |
| `AnticoagulantDrug` | string | - | İlaç adı ve doz |

**Notlar:**
- Patient'a doğrudan oküler bulgu/prosedür bağlanmaz.
- Research export'ta PII alanları kaldırılır; date shifting uygulanır.

**PII Politikası (NationalID / TC Kimlik No):**

| Aspect | Policy |
|--------|--------|
| **Saklama** | SQLCipher encrypted database'de şifreli saklanır |
| **UI Gösterim** | Her zaman masked: `***{son4}` formatı (örn: `***1234`) |
| **Tam Erişim** | Sadece kimlik doğrulama gerektiren işlemlerde (reçete yazdırma vb.) |
| **Research Export** | Bu alan **DAHİL EDİLMEZ** |
| **Hash Lookup** | Duplikasyon kontrolü için ayrı `NationalIDHash` (SHA-256) kolonu |
| **Audit Log** | NationalID erişimleri loglanır |

```typescript
// UI'da gösterim örneği
function maskNationalID(id: string): string {
  if (!id || id.length < 4) return '***'
  return `***${id.slice(-4)}`
}

// Tablo yapısı
interface Patient {
  // ... diğer alanlar
  NationalID?: string           // Encrypted, opsiyonel
  NationalIDHash?: string       // SHA-256, duplikasyon kontrolü için
}
```

#### 2.6.2 Eye (Göz)

**Amaç:** Lateralite + göz bazlı anatomik/baseline parametreler.

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| `EyeUUID` | string | ✅ | V4 UUID, immutable PK |
| `PatientID` | string | ✅ | FK → Patient.PatientUUID |
| `Laterality` | enum | ✅ | 'OD' \| 'OS' |
| `LensStatus` | enum | ✅ | 'Phakic' \| 'Pseudophakic-*' \| 'Aphakic' |
| `AxialLength` | number | - | mm cinsinden (miyopi takibi) |
| `IOLType` | string | - | Psödofakik ise IOL tipi |
| `BaselineVA` | number | - | logMAR formatında |
| `BaselineDate` | Date | - | Baseline ölçüm tarihi |

**Notlar:**
- LensStatus zaman içinde değişebilir. Güncel lens Eye'da tutulur.
- Tarihsel lens durumu Encounter FindingSet'te ayrıca izlenebilir.

#### 2.6.3 Case/Episode (Klinik Vaka)

**Amaç:** Tek bir hastalık süreci / iş akışı bağlamı. Aynı gözde birden fazla Case olabilir.

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| `CaseUUID` | string | ✅ | V4 UUID, immutable PK |
| `EyeID` | string | ✅ | FK → Eye.EyeUUID |
| `CaseGroupID` | number | ✅ | 1-10 arası (bkz. 03-CASE-GROUPS.md) |
| `PrimaryDiagnosis` | string | ✅ | RetinaConceptID/Code |
| `Status` | enum | ✅ | 'Active' \| 'Monitoring' \| 'Resolved' \| 'Referred' |
| `OpenedDate` | Date | ✅ | Case açılış tarihi |
| `ClosedDate` | Date | - | Case kapanış tarihi |
| `TreatmentRegimen` | enum | - | 'T&E' \| 'PRN' \| 'Fixed' \| 'Observation' |
| `CurrentIntervalWeeks` | number | - | T&E için mevcut aralık |

**İlişki Notu:**
- Bir Encounter birden fazla Case ile ilişkilenebilir (özellikle "Routine" ziyaretlerde).
- MVP'de "Encounter → Diagnosis link" üzerinden Case bağlamı türetilebilir.

#### 2.6.4 Encounter/Visit (Vizit)

**Amaç:** Zaman damgalı atomik klinik olay; wizard kapanış-validasyonunun ana hedefi.

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| `EncounterUUID` | string | ✅ | V4 UUID, immutable PK |
| `EyeID` | string | ✅ | FK → Eye.EyeUUID |
| `DateTime` | Date | ✅ | Vizit tarih/saat |
| `Type` | enum | ✅ | 'Routine' \| 'Injection' \| 'Laser' \| 'Surgery' \| 'PostOp' \| 'Emergency' \| 'Examination' \| 'Imaging' \| 'Consult' |
| `BilateralLinkID` | string | - | Aynı gün bilateral vizit ilişkisi |
| `ProcedureCode` | string | - | SGK/SUT kodu |

**FindingSet Yapısı (Mantıksal):**
Encounter içinde tutulacak bulgu paketi (MVP'de JSON + kritik kolonlar):
- **Kolonlar:** `va_logmar`, `va_snellen`, `cst_um`, `iop_mmhg` (sorgulanabilir)
- **JSON:** `clinical_findings` (geniş bulgu seti)

**Kapanış-Validasyon Minimum:**
- BCVA (logMAR veya Snellen)
- IOP (mmHg + ölçüm metodu)
- Lens durumu
- NextPlannedDate (takip güvenliği)

#### 2.6.5 Diagnosis (Tanı)

**Amaç:** Ontoloji ile uyumlu tanı seçimi + evre/alt tip standardizasyonu.

**İki Katmanlı Yapı:**

1. **Diagnosis Concept (Dictionary / Ontology Seed)**

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| `RetinaConceptID` | string | ✅ | Immutable kurum içi kimlik |
| `RetinaConceptCode` | string | ✅ | Human-readable kısa kod |
| `NameTR` | string | ✅ | Türkçe isim |
| `NameEN` | string | ✅ | İngilizce isim |
| `Synonyms` | string[] | - | Sinonimler + kısaltmalar |
| `DefaultCaseGroupID` | number | ✅ | Varsayılan Case grubu |
| `ICD11Code` | string | - | ICD-11 primary mapping |
| `ICD11URI` | string | - | ICD-11 browser link |
| `ICD10CodeLegacy` | string | - | ICD-10 legacy mapping (optional) |
| `SNOMEDCode` | string | - | SNOMED mapping |
| `StageSchemaRequired` | boolean | ✅ | Evre/alt tip zorunlu mu? |
| `Lifecycle` | enum | ✅ | 'Active' \| 'Deprecated' |

2. **Clinical Diagnosis Link (Encounter/Case bağlamı)**

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| `LinkID` | string | ✅ | PK |
| `EncounterID` | string | ✅ | FK → Encounter |
| `RetinaConceptID` | string | ✅ | FK → DiagnosisConcept |
| `IsPrimary` | boolean | ✅ | Birincil tanı mı? |
| `StageData` | JSON | - | Evre/alt tip verileri |

#### 2.6.6 Finding (Yapılandırılmış Bulgu Seti)

**Amaç:** Karar destek + araştırma için hesaplanabilir bulgu dili.

**FindingSet JSON Şeması:**

```json
{
  "$schemaVersion": "1.0.0",
  "vision": {
    "raw": "20/40",
    "logMAR": 0.3,
    "method": "Snellen" | "ETDRS"
  },
  "iop": {
    "value": 16,
    "method": "Applanation" | "NCT",
    "time": "10:30"
  },
  "lens": {
    "status": "Phakic" | "Pseudophakic" | "Aphakic",
    "note": "Early PSC"
  },
  "oct": {
    "IRF": true | false,
    "SRF": true | false,
    "PED": true | false,
    "cst_um": 285
  },
  "fundus": {
    "NVI": false,
    "NVD": false,
    "NVE": false,
    "hemorrhage": false,
    "exudate": false
  },
  "complications": {
    "endophthalmitis_suspicion": false,
    "high_iop_flag": false
  }
}
```

**Analitik Prensip:**
- Kritik numerikler (VA logMAR, CST um, IOP) **kolonlarda** tutulursa cohort sorguları hızlanır.
- Geniş bulgu seti JSON'da tutulabilir (esneklik + genişletilebilirlik).

#### 2.6.7 Imaging (Görüntü)

**Amaç:** Modalite + cihaz + tarih + dosya referansı + bütünlük doğrulaması.

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| `ImagingUUID` | string | ✅ | V4 UUID, immutable PK |
| `EncounterID` | string | ✅ | FK → Encounter |
| `Modality` | enum | ✅ | 'OCT' \| 'FA' \| 'ICGA' \| 'FP' \| 'USG' \| 'FAF' |
| `CaptureDate` | Date | ✅ | Çekim tarihi |
| `DeviceModel` | string | - | Cihaz modeli (önerilir) |
| `FilePathRelative` | string | ✅ | Dosya yolu (relativ) |
| `SHA256` | string | ✅ | Bütünlük hash'i |
| `SeriesGroupID` | string | - | Seri çekimler için grup ID |
| `ThumbnailSmallPath` | string | - | 300px thumbnail |
| `ThumbnailLargePath` | string | - | 1080px thumbnail |

**Kurallar:**
- **DB'ye BLOB yazılmaz.** Dosya yolu + SHA-256 hash tutulur.
- Hash uyuşmazlığı = "file corrupted" uyarısı.
- Seri karşılaştırma için `SeriesGroupID` veya DICOM UID kullanılır.

#### 2.6.8 Procedure (Prosedür)

**Amaç:** IVI / lazer / cerrahi / implant işlemlerinin güvenli ve izlenebilir kaydı.

**Genel Kural:** `Encounter.Type = Injection` demek "enjeksiyon yapıldı" demek değildir. Gerçek kayıt `InjectionRecord` prosedür tablosundan gelir.

**Alt Tipler:**

**A. InjectionRecord**

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| `InjectionUUID` | string | ✅ | PK |
| `EncounterID` | string | ✅ | FK → Encounter |
| `Agent` | enum | ✅ | 'Aflibercept' \| 'Ranibizumab' \| 'Bevacizumab' \| 'Faricimab' \| 'Brolucizumab' |
| `DoseMg` | number | ✅ | Doz (mg) |
| `LotNumber` | string | ✅ | Lot numarası |
| `ExpiryDate` | Date | ✅ | Son kullanma tarihi |
| `Complications` | string[] | - | Komplikasyonlar |

**B. LaserProcedure**

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| `LaserUUID` | string | ✅ | PK |
| `EncounterID` | string | ✅ | FK → Encounter |
| `Type` | enum | ✅ | 'PRP' \| 'Focal' \| 'Grid' \| 'Retinopexy' |
| `SpotCount` | number | - | Spot sayısı |
| `Parameters` | JSON | - | Güç, süre, spot boyutu |

**C. SurgeryProcedure**

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| `SurgeryUUID` | string | ✅ | PK |
| `EncounterID` | string | ✅ | FK → Encounter |
| `Indication` | string | ✅ | Endikasyon |
| `Technique` | string[] | ✅ | PPV, SB, kombine vb. |
| `Tamponade` | enum | - | 'Air' \| 'SF6' \| 'C3F8' \| 'SiliconOil' \| 'None' |
| `IntraopComplications` | string[] | - | İntraop komplikasyonlar |
| `PostopPlan` | string | - | Postop plan notları |

**Safety Baseline:**
- Lot/SKT kontrolü (tarihi geçmiş = blocking uyarı)
- Yanlış göz doğrulaması (OD/OS popup)
- Zorunlu alan kontrolü (ilaç seçilmeden kapanış yok)

#### 2.6.9 Outcome (Sonuç/İzlem)

**Amaç:** Klinik sonuçların trendlenmesi ve araştırma çıktısı.

**İki Yaklaşım:**

1. **Hesaplanan (View):** VA/CST trendleri runtime hesaplanır.
2. **Snapshot (Persist):** Case kapanışı veya kilometre taşlarında özet kaydedilir.

**Önerilen Metrikler:**

| Metrik | Hesaplama | Kullanım |
|--------|-----------|----------|
| BCVA Trend | baseline → last / best / worst | Tedavi etkinliği |
| CST Trend | baseline → last | Anatomik yanıt |
| Fluid-Free Streak | OCT sıvı yok ardışık vizit sayısı | T&E karar desteği |
| Injection Count | Son 12 ay IVI sayısı | Tedavi yükü |
| Complication Flag | Prosedür komplikasyonları | Güvenlik izlemi |

#### 2.6.10 CaseEncounterLink (Vaka-Vizit İlişkisi)

**Amaç:** Bir Encounter birden fazla Case'e ait olabilir (N:N ilişki). Bu tablo, Case ve Encounter arasındaki ilişkiyi ve rolünü tanımlar.

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| `LinkID` | string | ✅ | V4 UUID, PK |
| `CaseID` | string | ✅ | FK → Case.CaseUUID |
| `EncounterID` | string | ✅ | FK → Encounter.EncounterUUID |
| `Role` | enum | ✅ | 'Primary' \| 'Secondary' |
| `CreatedAt` | DateTime | ✅ | Otomatik timestamp |

**Kurallar:**
- Her Encounter **en az bir** Primary Case'e bağlı olmalıdır.
- Bir Encounter birden fazla Case ile ilişkilendirilebilir (örn: DME tedavisi + RVO takibi).
- `Role = 'Primary'` → Ana tedavi/takip amacı
- `Role = 'Secondary'` → İlişkili/eşzamanlı durum

#### 2.6.11 EncounterClosureRules (Vizit Kapanış Validasyonu)

**Amaç:** Encounter türüne göre kapanış öncesi zorunlu validasyon kuralları.

```typescript
type EncounterClosureRule = {
  encounterType: EncounterType
  requiredFields: string[]
  conditionalRules?: ConditionalRule[]
}

const ENCOUNTER_CLOSURE_RULES: EncounterClosureRule[] = [
  // === Clinical Encounter Types ===
  {
    encounterType: 'Routine',
    requiredFields: ['laterality', 'bcva', 'iop', 'lens_status', 'fundus_summary', 'plan']
  },
  {
    encounterType: 'Examination',
    requiredFields: ['laterality', 'bcva', 'fundus_summary', 'plan']
  },
  {
    encounterType: 'PostOp',
    requiredFields: ['laterality', 'bcva', 'iop', 'wound_status', 'complications'],
    conditionalRules: [
      { if: 'complications_present', then: ['complication_details', 'intervention'] }
    ]
  },
  {
    encounterType: 'Emergency',
    requiredFields: ['laterality', 'chief_complaint', 'bcva', 'diagnosis', 'urgency_level', 'plan']
  },

  // === Procedure Encounter Types ===
  {
    encounterType: 'Injection',
    requiredFields: ['laterality', 'bcva', 'iop', 'lens_status'],
    conditionalRules: [
      { if: 'injection_performed', then: ['drug', 'lot_number', 'antisepsis'] }
    ]
  },
  {
    encounterType: 'Surgery',
    requiredFields: ['laterality', 'procedure_type', 'anesthesia', 'complications']
  },
  {
    encounterType: 'Laser',
    requiredFields: ['laterality', 'laser_type', 'spot_count', 'power_mw']
  },

  // === Diagnostic & Consultation Encounter Types ===
  {
    encounterType: 'Imaging',
    requiredFields: ['laterality', 'modality', 'device', 'image_quality']
  },
  {
    encounterType: 'Consult',
    requiredFields: ['referring_physician', 'reason', 'recommendation']
  }
]
```

**Validasyon Akışı:**
1. Encounter kapatılmaya çalışıldığında `ENCOUNTER_CLOSURE_RULES` kontrol edilir.
2. `requiredFields` eksikse → Hata mesajı + eksik alan listesi gösterilir.
3. `conditionalRules` varsa → Koşul değerlendirilir, gerekirse ek alanlar zorunlu tutulur.
4. Tüm validasyonlar geçerse → `Encounter.Status = 'Closed'`

### 2.7 Ontoloji Kodlama Standardı

> **Tek Kaynak İlkesi:** RetinaConceptID değişmez; isimler ve sinonimler güncellenebilir.

#### 2.7.1 RetinaConceptID vs Code Ayrımı

| Kavram | Özellik | Örnek |
|--------|---------|-------|
| `RetinaConceptID` | Immutable, kurum içi stabil kimlik | `RC-AMD-001` |
| `RetinaConceptCode` | Human-readable, hiyerarşik | `C1.AMD.WET` |

#### 2.7.2 Concept Metadata

Her diagnosis concept için tutulacak veriler:
- TR isim / EN isim
- Sinonimler + kısaltmalar (ERM = premacular fibrosis, macular pucker…)
- Default `CaseGroupID`
- External mapping (ICD-11 primary, ICD-10 legacy optional, SNOMED optional)
- **Zorunlu evre/alt tip var mı?** (varsa "StageSchema")
- Yaşam döngüsü: `Active | Deprecated` + `ReplacedByRetinaConceptID?`

#### 2.7.3 Zorunlu Stage/Subtype ("StagePack")

Bazı tanılar için stage/subtype alanları "boş bırakılamaz":

| Tanı | Zorunlu Alan | Değerler |
|------|--------------|----------|
| RVO | `PerfusionStatus` | 'Ischemic' \| 'Non-ischemic' \| 'Unknown' |
| nAMD | `LesionType` + `ActivityStatus` | Occult/Classic/Mixed + Active/Inactive |
| DR | `DRStage` + `CenterInvolvement` | Mild/Moderate/Severe/PDR + CI-DME/Non-CI |

**Kapanış-Validasyon:**
- Stage zorunlu ise: "Unknown" seçilmedikçe boş kalamaz.
- UX'de açık hata mesajı gösterilir.

#### 2.7.4 Ontoloji Arama UX

- Dropdown sadece "tanı listesi" değildir; sinonim ve kısaltmalarla arama desteklenir.
- Seçim sonrası:
  - Default CaseGroup önerisi
  - StagePack zorunluluğu varsa otomatik step açılması

---

## BÖLÜM 3: FONKSİYONEL MODÜLLER (FUNCTIONAL MODULES)

### 3.1 Çekirdek Modüller (Core - Her EHR'de Ortak)

| #     | Modül                | Açıklama                                   |
| ----- | -------------------- | ------------------------------------------ |
| **1** | Patient Registry     | Demografi, sistemik riskler, KVKK consent  |
| **2** | Appointment System   | Offline takvim, randevu hatırlatıcıları    |
| **3** | Encounter Management | Vizit tipi, tarih, hekim, bilateral link   |
| **4** | User/Role Management | Hekim, asistan, sekreter rolleri           |
| **5** | Audit Log            | Tüm CRUD işlemlerinin değiştirilemez kaydı |
| **6** | Backup/Restore       | Otomatik zip + tarih damgası               |

### 3.2 Retina-Özgü Modüller

| #     | Modül                      | Detay Belgesi                                                                                                |
| ----- | -------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **1** | **Patient Banner**         | [06-DESIGN-SYSTEM.md](./06-DESIGN-SYSTEM.md) §12                                                             |
| **2** | **Dual Timeline (OD/OS)**  | [01-ENGINEERING-GUIDE.md](./01-ENGINEERING-GUIDE.md) + Bu belge §3.3                                         |
| **3** | **Smart Injection Wizard** | [05-CLINICAL-ALGORITHMS.md](./05-CLINICAL-ALGORITHMS.md) + [03-CASE-GROUPS.md](./03-CASE-GROUPS.md) Case 1   |
| **4** | **OCT Viewer**             | [06-DESIGN-SYSTEM.md](./06-DESIGN-SYSTEM.md) §12 + [01-ENGINEERING-GUIDE.md](./01-ENGINEERING-GUIDE.md)      |
| **5** | **Laser Module**           | [05-CLINICAL-ALGORITHMS.md](./05-CLINICAL-ALGORITHMS.md) + [03-CASE-GROUPS.md](./03-CASE-GROUPS.md) Case 2   |
| **6** | **Surgery Module**         | [05-CLINICAL-ALGORITHMS.md](./05-CLINICAL-ALGORITHMS.md) + [03-CASE-GROUPS.md](./03-CASE-GROUPS.md) Case 5-6 |
| **7** | **Research Export**        | Bu belge Bölüm 5                                                                                             |

### 3.3 İkili Zaman Çizelgesi (Dual Timeline) Detayı

*Kod Lokasyonu: `src/renderer/features/patient-timeline` (Bkz: [01-ENGINEERING-GUIDE.md](./01-ENGINEERING-GUIDE.md) Klasör Yapısı)*

**UI Yerleşimi:**

```
┌─────────────────────────────────────────────────────────────┐
│ PATIENT BANNER (Sticky)                                     │
├────────────────┬────────────────────────────────────────────┤
│                │  ┌──────────────────────────────────┐      │
│   FILTERS      │  │   OD TIMELINE                    │      │
│   ─────────    │  │   ───────────────                │      │
│   ☑️ Injections│  │   ● 2025-12-25: Vabysmo (Week 8) │      │
│   ☑️ Surgery   │  │   ● 2025-11-20: Eylea (Week 6)   │      │
│   ☐ Imaging    │  │   ● 2025-10-10: Loading Dose 3   │      │
│                │  └──────────────────────────────────┘      │
│                │                                             │
│                │  ┌──────────────────────────────────┐      │
│                │  │   OS TIMELINE                    │      │
│                │  │   ───────────────                │      │
│                │  │   ● 2025-09-15: ERM Surgery      │      │
│                │  │   ● 2024-06-10: Baseline Visit   │      │
│                │  └──────────────────────────────────┘      │
└────────────────┴────────────────────────────────────────────┘
```

**Data Flow:**

```typescript
// Timeline Component
const PatientTimeline = ({ patientId }: Props) => {
  const { odEvents, osEvents } = useTimelineData(patientId);
  const filters = useFilterStore();
  
  return (
    <div className="timeline-grid">
      <EyeTimeline 
        laterality="OD" 
        events={odEvents.filter(filters.apply)} 
      />
      <EyeTimeline 
        laterality="OS" 
        events={osEvents.filter(filters.apply)} 
      />
    </div>
  );
};
```

---

## BÖLÜM 4: KARAR DESTEK VE ARAŞTIRMA

### 4.1 T&E (Treat-and-Extend) Otomatik Öneri Motoru

*Algoritma Detayı: [05-CLINICAL-ALGORITHMS.md](./05-CLINICAL-ALGORITHMS.md) T&E Bölümü*

**Karar Tablosu:**

| Durum           | OCT Sıvı              | VA Değişimi            | Aksiyon                       |
| --------------- | --------------------- | ---------------------- | ----------------------------- |
| **İdeal**       | SRF=Yok, IRF=Yok      | Stabil (±5 harf)       | **Extend +2w** (Max 16w)      |
| **Kısmi Yanıt** | SRF=Az                | Hafif düşüş (-10 harf) | **Maintain** interval         |
| **Yetersiz**    | IRF=Var               | Orta düşüş (-15 harf)  | **Shorten -4w**               |
| **Başarısız**   | IRF+SRF, PED büyümesi | Ciddi düşüş (-20 harf) | **Switch drug** + Reset to 4w |

**Kod Referansı:** `src/main/services/te-engine.service.ts`

### 4.2 Araştırma Veri Dışa Aktarımı

**Hedef:** Tek tıkla anonim, SPSS/R/Python uyumlu veri seti.

**Çıktı Formatı:**

| Hasta ID | Göz | Tanı       | İlk IVI    | Son IVI    | Toplam IVI | VA Başlangıç | VA Son | CST Başlangıç | CST Son |
| -------- | --- | ---------- | ---------- | ---------- | ---------- | ------------ | ------ | ------------- | ------- |
| R-0123   | OD  | nAMD-Type1 | 2024-01-15 | 2025-12-20 | 18         | 0.60         | 0.30   | 425           | 285     |

**Anonimleştirme:**

*   Hasta ID → Sıralı kod (`R-0001`)
*   Tarihler → İlk vizit tarihinden itibaren gün sayısı (`Day 0`, `Day 365`)
*   İsim/TC → Çıktıdan kaldırılır

**Kod:** `src/main/services/export.service.ts`

---

## BÖLÜM 5: GÜVENLİK VE UYUMLULUK

### 5.1 Veri Şifreleme (SQLCipher)

*Teknik Detay: [01-ENGINEERING-GUIDE.md](./01-ENGINEERING-GUIDE.md) Bölüm 3.1*

```typescript
// Master password → PBKDF2 (100,000 iterations) → DB Key
const dbKey = crypto.pbkdf2Sync(
  masterPassword,
  salt,
  100000,
  32,
  'sha256'
);

db.pragma(`key = "x'${dbKey.toString('hex')}'"`);
```

### 5.2 Dosya Bütünlüğü (SHA-256 Checksums)

Her görüntü import edildiğinde:

```typescript
const hash = crypto.createHash('sha256');
const fileBuffer = fs.readFileSync(imagePath);
hash.update(fileBuffer);
const checksum = hash.digest('hex');

// Store in DB
await db.run('INSERT INTO imaging_files (sha256, ...) VALUES (?, ...)', checksum);
```

Dosya açılırken hash tekrar hesaplanıp DB ile karşılaştırılır. Uyuşmuyorsa → **File corrupted** uyarısı.

### 5.3 KVKK ve MDR Uyumluluk

*   **Aydınlatma Metni:** İlk kayıtta gösterilir, dijital onay alınır.
*   **Veri Taşınabilirliği:** Hasta isterse tüm verisi `JSON` olarak export edilir.
*   **Erişim Kontrolü:** Role-based (Hekim: Tüm veri, Asistan: Sadece okuma).
*   **Audit Trail:** Tüm veri erişimi loglarda kayıtlıdır (Değiştirilemez).

---

## BÖLÜM 6: DOKÜMANTASYON ÇAPRAZ REFERANSLARI

### Hızlı Referans Tablosu

| Bulmak İstediğiniz                             | Nereye Bakmalısınız                                                                                        |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Renk token değeri (örn. Primary Teal hex kodu) | [06-DESIGN-SYSTEM.md](./06-DESIGN-SYSTEM.md) §2                                                            |
| Enjeksiyon wizard adımları                     | [05-CLINICAL-ALGORITHMS.md](./05-CLINICAL-ALGORITHMS.md) + [03-CASE-GROUPS.md](./03-CASE-GROUPS.md) Case 1 |
| IPC channel tanımları                          | [01-ENGINEERING-GUIDE.md](./01-ENGINEERING-GUIDE.md) IPC Bölümü                                            |
| Hastalık ontolojisi (nAMD alt tipleri)         | [02-CLINICAL-ONTOLOGY.md](./02-CLINICAL-ONTOLOGY.md)                                                       |
| Button component SCSS                          | [06-DESIGN-SYSTEM.md](./06-DESIGN-SYSTEM.md) §10.1                                                         |
| SQLite migration örneği                        | [01-ENGINEERING-GUIDE.md](./01-ENGINEERING-GUIDE.md) DB Bölümü                                             |
| Patient Banner tasarımı                        | [06-DESIGN-SYSTEM.md](./06-DESIGN-SYSTEM.md) §12.1                                                         |
| T&E algoritma mantığı                          | Bu belge Bölüm 4.1 + [05-CLINICAL-ALGORITHMS.md](./05-CLINICAL-ALGORITHMS.md)                              |

---

## BÖLÜM 7: PROJE YOL HARİTASI (PROJECT ROADMAP)

### 7.1 Faz Tabanlı Geliştirme Stratejisi

Maculogic, MVP (Minimum Viable Product) yaklaşımıyla aşamalı olarak geliştirilmelidir. Her faz, bir önceki fazın üzerine inşa edilir.

| Faz             | Süre       | Kapsam                    | Teslim Hedefi                |
| --------------- | ---------- | ------------------------- | ---------------------------- |
| **MVP (Faz 1)** | 8-12 hafta | Çekirdek EHR + Enjeksiyon | Tek hekimin günlük kullanımı |
| **Faz 2**       | 6-8 hafta  | Görüntüleme + DICOM       | OCT/FA entegrasyonu          |
| **Faz 3**       | 4-6 hafta  | Cerrahi Modülü            | Post-op takip                |
| **Faz 4**       | 4-6 hafta  | Araştırma/Export          | Bilimsel veri çıktısı        |
| **Faz 5**       | 6-8 hafta  | Gelişmiş Karar Destek     | T&E algoritması otomasyonu   |

#### Faz 1: MVP (Minimum Viable Product)

**Hedef:** Tek hekimin günlük retina pratiğini yönetebilmesi.

**Modüller:**
- Patient Registry (Demografi, sistemik riskler, KVKK consent)
- OD/OS Muayene Formu (VA, IOP, fundus özet)
- Enjeksiyon Modülü
  - İlaç seçimi (Eylea, Vabysmo, Lucentis, Altuzan, Ozurdex)
  - Lot/Seri no takibi
  - T&E takip planı (Manuel)
- Dual Timeline (Basit liste görünümü)
- Offline SQLite + SQLCipher

**Çıktı:** Hekim, nAMD/DME hastalarını kaydedebilir, enjeksiyon yapabilir, takip planlayabilir.

#### Faz 2: Görüntüleme Entegrasyonu

**Hedef:** OCT/FA görüntülerini sisteme aktarabilme.

**Modüller:**
- Hot Folder (Cihazlardan otomatik import)
- DICOM Parser (En az 1 cihaz: Heidelberg veya Zeiss)
- OCT Viewer
  - Seri karşılaştırma (T0 vs T-Current)
  - Temel anotasyon (SRF/IRF işaretleme)
- Sharp.js Thumbnail Cache

**Çıktı:** Hekim, OCT'leri sistemde görüntüleyebilir, önceki vizitlerle karşılaştırabilir.

#### Faz 3: Vitreoretinal Cerrahi

**Hedef:** Ameliyat raporları ve post-op takip.

**Modüller:**
- Pre-op Planlama (RRD, ERM, Maküler Delik wizards)
- İntraop Kayıt (Gauge, tamponad, komplikasyonlar)
- Post-op Takip (Pozisyon, kontrol takvimi, re-detachment izlemi)

**Çıktı:** Hekim, cerrahi vakalarını kaydedebilir ve post-op komplikasyonları takip edebilir.

#### Faz 4: Araştırma ve Registry

**Hedef:** Bilimsel veri çıktısı.

**Modüller:**
- Kohort Builder (Filtreler: Tanı, ajan, tedavi süresi)
- Anonim Export (CSV/Parquet)
- Date Shifting (KVKK uyumlu)

**Çıktı:** Hekim, "Son 2 yıldaki tüm nAMD hastaları" sorgusu yapabilir, anonimleştirilmiş veri alabilir.

#### Faz 5: Gelişmiş Karar Destek

**Hedef:** T&E algoritması otomasyonu.

**Modüller:**
- T&E Öneri Motoru (OCT sıvı + VA değişimi → Otomatik aralık önerisi)
- Kural tabanlı uyarılar (Geciken randevu, nüks riski)
- İçgörü Panelleri (VA/CST trend grafikleri)

**Çıktı:** Sistem, bir sonraki enjeksiyon tarihini otomatik önerir.

---

## BÖLÜM 8: RİSK YÖNETİMİ VE AZALTIM STRATEJİLERİ

### 8.1 Teknik Riskler

| Risk                              | Olasılık | Etki   | Azaltım Stratejisi                                                      |
| --------------------------------- | -------- | ------ | ----------------------------------------------------------------------- |
| **Veri Kaybı** (Disk arızası)     | Orta     | Kritik | Otomatik yedekleme (günlük zip + tarih damgası), bulut sync opsiyonu    |
| **Görüntü Şişmesi** (100GB+ veri) | Yüksek   | Orta   | Thumbnail cache, DICOM sıkıştırma, eski görüntü arşivleme uyarısı       |
| **Cihaz Entegrasyon Hatası**      | Yüksek   | Orta   | Fallback: Manuel dosya import, adapter mimarisi                         |
| **SQLite Performans Düşüşü**      | Düşük    | Orta   | İndeksleme, query optimizasyonu, 10K+ hasta için PostgreSQL geçiş planı |

### 8.2 Klinik Güvenlik Riskleri

| Risk                       | Azaltım                                                                          |
| -------------------------- | -------------------------------------------------------------------------------- |
| **Yanlış Göz Enjeksiyonu** | Laterality (OD/OS) renk kodu (Kırmızı/Yeşil), doğrulama popup'ı                  |
| **Tarihi Geçmiş İlaç**     | Lot/expiration date kontrolü, kırmızı uyarı                                      |
| **Kaçırılan Takip**        | Otomatik hatırlatma (offline calendar), "Gecikmiş Randevular" dashboard widget'ı |

### 8.3 Regülasyon Riskleri

| Risk                | Azaltım                                                                                        |
| ------------------- | ---------------------------------------------------------------------------------------------- |
| **KVKK Şikayeti**   | Consent management, audit log (kim, ne zaman, hangi veriyi gördü), veri silme/export işlevleri |
| **MDR SaMD Sınıfı** | Karar destek modülünü ayrılaştır, "öneri" modunda tut (tanı koymaz, sadece bilgi sağlar)       |

### 8.4 Kullanılabilirlik Riskleri

| Risk               | Azaltım                                                           |
| ------------------ | ----------------------------------------------------------------- |
| **Karmaşık UI**    | Usability testing (en az 3 hekim ile pilot), wizard bazlı formlar |
| **Öğrenme Eğrisi** | Walkthrough video, inline tooltips, demo veri seti                |

---

## BÖLÜM 9: VERSİYON GEÇMİŞİ

| Versiyon | Tarih          | Değişiklikler                                                                  |
| -------- | -------------- | ------------------------------------------------------------------------------ |
| 7.2.0    | 01 Ocak 2026   | i18n çoklu dil desteği eklendi (TR/EN), AI Agent kurallarına i18n eklendi.     |
| 7.1.0    | 31 Aralık 2025 | § 2.6 Veri Sözlüğü (Data Dictionary) ve § 2.7 Ontoloji Kodlama Standardı eklendi. |
| 7.0.0    | 31 Aralık 2025 | P0/P1 Harmonization: Offline-first, Token Consistency, AI Rules.               |
| 6.1.0    | 30 Aralık 2025 | Unified Master: Veri modelleri, modül detayları ve çapraz referanslar eklendi. |
| 6.0.0    | 30 Aralık 2025 | System Navigator: İlk entegre versiyon.                                        |

---

> **SON NOT:** Bu belge, Maculogic projesinin "Anayasası"dır. Kod yazarken veya tasarım kararları verirken **mutlaka** bu belgeye ve referans ettiği uzmanlık belgelerine danışın. Hardcoded değerler, tutarsız isimler veya eksik referanslar kabul edilemez.
