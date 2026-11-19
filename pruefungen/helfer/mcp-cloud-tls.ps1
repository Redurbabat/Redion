param([Parameter(Mandatory=$true)][string]$OutputFile)
$ErrorActionPreference='Stop'
# Flüchtiges Zertifikat nur für den synthetischen Loopback-Prüfserver.
# Kein Zertifikatsspeicher und keine Windows-Vertrauenseinstellung wird geändert.
$redionTestRsa=[System.Security.Cryptography.RSA]::Create(2048)
try {
  $redionTestRequest=[System.Security.Cryptography.X509Certificates.CertificateRequest]::new(
    'CN=127.0.0.1',$redionTestRsa,[System.Security.Cryptography.HashAlgorithmName]::SHA256,
    [System.Security.Cryptography.RSASignaturePadding]::Pkcs1)
  $redionTestNames=[System.Security.Cryptography.X509Certificates.SubjectAlternativeNameBuilder]::new()
  $redionTestNames.AddIpAddress([System.Net.IPAddress]::Parse('127.0.0.1'))
  $redionTestRequest.CertificateExtensions.Add($redionTestNames.Build())
  $redionTestCertificate=$redionTestRequest.CreateSelfSigned([System.DateTimeOffset]::UtcNow.AddMinutes(-1),[System.DateTimeOffset]::UtcNow.AddDays(1))
  try {[System.IO.File]::WriteAllBytes($OutputFile,$redionTestCertificate.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Pfx,''))}
  finally {$redionTestCertificate.Dispose()}
} finally {$redionTestRsa.Dispose()}
