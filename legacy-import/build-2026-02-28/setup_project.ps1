# VERNEN™ Project Setup Script
# Reorganizes flat build deliverables into Vite-compatible src/ structure
# Run from: C:\Users\SagFi\Proton Drive\Michetype78\My files\MASTER_VERNEN\03_Deployments\BUILD_2026-02-28

param(
    [string]$ProjectRoot = "C:\Users\SagFi\Projects\vernen-platform"
)

Write-Host "`n=== VERNEN™ Project Setup ===" -ForegroundColor Cyan
Write-Host "Target: $ProjectRoot`n"

$BuildDir = $PSScriptRoot
if (-not $BuildDir) {
    $BuildDir = "C:\Users\SagFi\Proton Drive\Michetype78\My files\MASTER_VERNEN\03_Deployments\BUILD_2026-02-28"
}

# Create project structure
$dirs = @(
    "$ProjectRoot\src\components\gdn_navigator",
    "$ProjectRoot\src\components\validation_engine",
    "$ProjectRoot\src\components\filing_guide",
    "$ProjectRoot\src\components\audit",
    "$ProjectRoot\src\components\assembly",
    "$ProjectRoot\src\components\help",
    "$ProjectRoot\src\engines",
    "$ProjectRoot\src\infrastructure",
    "$ProjectRoot\src\platform",
    "$ProjectRoot\src\auth",
    "$ProjectRoot\src\payments",
    "$ProjectRoot\src\traceability",
    "$ProjectRoot\src\remediation",
    "$ProjectRoot\src\filesign",
    "$ProjectRoot\src\server",
    "$ProjectRoot\src\server\routes",
    "$ProjectRoot\src\tests",
    "$ProjectRoot\src\i18n",
    "$ProjectRoot\src\data\annotations\tierb",
    "$ProjectRoot\src\data\annotations\tierc",
    "$ProjectRoot\src\data\glossaries",
    "$ProjectRoot\src\styles",
    "$ProjectRoot\src\errors",
    "$ProjectRoot\public"
)

foreach ($d in $dirs) {
    New-Item -ItemType Directory -Path $d -Force | Out-Null
}
Write-Host "[OK] Directory structure created" -ForegroundColor Green

# File mapping: source (relative to build) -> destination (relative to project)
$fileMaps = @{
    # Root config files
    "package.json"       = "package.json"
    "vite.config.js"     = "vite.config.js"
    "index.html"         = "index.html"

    # Entry point
    "src\main.jsx"       = "src\main.jsx"

    # App shell
    "App.jsx"            = "src\App.jsx"

    # Styles
    "styles\vernen-tokens.css" = "src\styles\vernen-tokens.css"

    # UI Components
    "gdn_navigator\GDN_Navigator.jsx"           = "src\gdn_navigator\GDN_Navigator.jsx"
    "validation_engine\ValidationResults.jsx"    = "src\validation_engine\ValidationResults.jsx"
    "filing_guide\FilingGuideView.jsx"           = "src\filing_guide\FilingGuideView.jsx"
    "audit\AuditReportView.jsx"                  = "src\audit\AuditReportView.jsx"
    "assembly\DocumentAssemblyView.jsx"          = "src\assembly\DocumentAssemblyView.jsx"
    "help\HelpPanel.jsx"                         = "src\help\HelpPanel.jsx"

    # Engines
    "validation_engine\FormValidationEngine.js"  = "src\validation_engine\FormValidationEngine.js"
    "filing_guide\FilingGuideGenerator.js"       = "src\filing_guide\FilingGuideGenerator.js"
    "audit\AuditReportGenerator.js"              = "src\audit\AuditReportGenerator.js"
    "assembly\DocumentAssemblyEngine.js"         = "src\assembly\DocumentAssemblyEngine.js"

    # Infrastructure
    "persistence\PersistenceManager.js"          = "src\persistence\PersistenceManager.js"
    "export\ExportEngine.js"                     = "src\export\ExportEngine.js"
    "a11y\AccessibilityManager.js"               = "src\a11y\AccessibilityManager.js"
    "platform\PlatformIntegrationRouter.js"      = "src\platform\PlatformIntegrationRouter.js"
    "errors\ErrorBoundary.jsx"                   = "src\errors\ErrorBoundary.jsx"

    # Platform Integration Layer
    "platform\PlatformContext.jsx"               = "src\platform\PlatformContext.jsx"
    "platform\ModuleConnector.js"                = "src\platform\ModuleConnector.js"
    "platform\useVERNEN.js"                      = "src\platform\useVERNEN.js"

    # Auth
    "auth\AuthManager.js"                        = "src\auth\AuthManager.js"
    "auth\AuthContext.jsx"                       = "src\auth\AuthContext.jsx"

    # Payments
    "payments\PaymentManager.js"                 = "src\payments\PaymentManager.js"
    "payments\PaymentContext.jsx"                = "src\payments\PaymentContext.jsx"

    # Traceability
    "traceability\TraceabilityLogger.js"         = "src\traceability\TraceabilityLogger.js"

    # Remediation
    "remediation\RemediationEngine.js"           = "src\remediation\RemediationEngine.js"

    # File & Sign
    "filesign\ESignatureEngine.js"               = "src\filesign\ESignatureEngine.js"
    "filesign\EFSPGateway.js"                    = "src\filesign\EFSPGateway.js"

    # Server
    "server\index.js"                            = "src\server\index.js"
    "server\package.json"                        = "src\server\package.json"
    "server\schema.sql"                          = "src\server\schema.sql"
    "server\.env.example"                        = "src\server\.env.example"
    "server\routes\auth.js"                      = "src\server\routes\auth.js"
    "server\routes\payments.js"                  = "src\server\routes\payments.js"
    "server\routes\efiling.js"                   = "src\server\routes\efiling.js"

    # Tests
    "tests\e2e.test.js"                          = "src\tests\e2e.test.js"
    "vitest.config.js"                           = "vitest.config.js"

    # Data Layer
    "data\DataLayerConnector.js"                 = "src\data\DataLayerConnector.js"
    "data\assembly_field_maps.json"              = "src\data\assembly_field_maps.json"

    # i18n
    "i18n\i18n.jsx"              = "src\i18n\i18n.jsx"
    "i18n\ui_strings_en.json"    = "src\i18n\ui_strings_en.json"
    "i18n\ui_strings_es.json"    = "src\i18n\ui_strings_es.json"
    "i18n\ui_strings_zh.json"    = "src\i18n\ui_strings_zh.json"
    "i18n\ui_strings_vi.json"    = "src\i18n\ui_strings_vi.json"
    "i18n\ui_strings_ko.json"    = "src\i18n\ui_strings_ko.json"
    "i18n\ui_strings_ar.json"    = "src\i18n\ui_strings_ar.json"
    "i18n\ui_strings_tl.json"    = "src\i18n\ui_strings_tl.json"
    "i18n\ui_strings_ru.json"    = "src\i18n\ui_strings_ru.json"
    "i18n\ui_strings_pt.json"    = "src\i18n\ui_strings_pt.json"
    "i18n\ui_strings_ht.json"    = "src\i18n\ui_strings_ht.json"
    "i18n\ui_strings_so.json"    = "src\i18n\ui_strings_so.json"
    "i18n\ui_strings_ti.json"    = "src\i18n\ui_strings_ti.json"
    "i18n\ui_strings_am.json"    = "src\i18n\ui_strings_am.json"
}

$copied = 0
$missing = 0
foreach ($src in $fileMaps.Keys) {
    $srcPath = Join-Path $BuildDir $src
    $dstPath = Join-Path $ProjectRoot $fileMaps[$src]
    if (Test-Path $srcPath) {
        Copy-Item $srcPath $dstPath -Force
        $copied++
    } else {
        Write-Host "  [MISS] $src" -ForegroundColor Yellow
        $missing++
    }
}

Write-Host "[OK] Copied $copied files ($missing missing)" -ForegroundColor Green

# ─── BULK COPY: Annotations, Registries, Glossaries ──────────────────
Write-Host "`nCopying data layer files..." -ForegroundColor Cyan
$bulkCopied = 0

# Tier A annotations (root-level JSON files matching form IDs)
$tierAForms = @("FL-100","FL-110","FL-115","FL-120","FL-130","FL-140","FL-141",
    "FL-300","FL-305","FL-310","FL-311","FL-312","FL-320","FL-341",
    "DV-100","DV-109","DV-110","MC-030","MC-031","FW-001","FW-003")
foreach ($form in $tierAForms) {
    $src = Join-Path $BuildDir "data\annotations\$form.json"
    $dst = Join-Path $ProjectRoot "src\data\annotations\$form.json"
    if (Test-Path $src) { Copy-Item $src $dst -Force; $bulkCopied++ }
    else { Write-Host "  [MISS] annotations\$form.json" -ForegroundColor Yellow }
}

# Tier B annotations
$tierBDir = Join-Path $BuildDir "data\annotations\tierb"
if (Test-Path $tierBDir) {
    Get-ChildItem $tierBDir -Filter *.json | ForEach-Object {
        Copy-Item $_.FullName (Join-Path $ProjectRoot "src\data\annotations\tierb\$($_.Name)") -Force
        $bulkCopied++
    }
}

# Tier C annotations
$tierCDir = Join-Path $BuildDir "data\annotations\tierc"
if (Test-Path $tierCDir) {
    Get-ChildItem $tierCDir -Filter *.json | ForEach-Object {
        Copy-Item $_.FullName (Join-Path $ProjectRoot "src\data\annotations\tierc\$($_.Name)") -Force
        $bulkCopied++
    }
}

# Registries
foreach ($reg in @("form_registry.json","scenario_index.json","form_registry_tierc.json","scenario_index_tierc.json")) {
    $src = Join-Path $BuildDir "data\annotations\$reg"
    $dst = Join-Path $ProjectRoot "src\data\annotations\$reg"
    if (Test-Path $src) { Copy-Item $src $dst -Force; $bulkCopied++ }
}

# Glossaries
$glossaryDir = Join-Path $BuildDir "data\glossaries"
if (Test-Path $glossaryDir) {
    Get-ChildItem $glossaryDir -Filter *.json | ForEach-Object {
        Copy-Item $_.FullName (Join-Path $ProjectRoot "src\data\glossaries\$($_.Name)") -Force
        $bulkCopied++
    }
}

Write-Host "[OK] Bulk copied $bulkCopied data files" -ForegroundColor Green
$faviconSvg = @'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#1a3a5c"/>
  <text x="16" y="22" text-anchor="middle" fill="#fff" font-family="Arial,sans-serif" font-weight="700" font-size="18">V</text>
</svg>
'@
Set-Content -Path "$ProjectRoot\public\favicon.svg" -Value $faviconSvg -Encoding UTF8
Write-Host "[OK] Favicon created" -ForegroundColor Green

# Create .gitignore
$gitignore = @"
node_modules/
dist/
.env
.env.local
*.log
.DS_Store
Thumbs.db
"@
Set-Content -Path "$ProjectRoot\.gitignore" -Value $gitignore -Encoding UTF8
Write-Host "[OK] .gitignore created" -ForegroundColor Green

# Summary
$totalFiles = (Get-ChildItem $ProjectRoot -Recurse -File | Where-Object { $_.FullName -notlike "*node_modules*" }).Count
Write-Host "`n=== Setup Complete ===" -ForegroundColor Cyan
Write-Host "Project: $ProjectRoot"
Write-Host "Files: $totalFiles"
Write-Host "`nNext steps:"
Write-Host "  cd $ProjectRoot"
Write-Host "  npm install"
Write-Host "  npm run dev"
Write-Host ""
