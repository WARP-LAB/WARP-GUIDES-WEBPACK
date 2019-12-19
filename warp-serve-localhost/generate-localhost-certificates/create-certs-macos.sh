#!/bin/bash

# createCa

VALET_HOME_PATH=$HOME'/.localhost-dev-certs'

echo $VALET_HOME_PATH

caPath() {
  echo $VALET_HOME_PATH'/CA'
}

certificatesPath() {
  echo $VALET_HOME_PATH'/Certificates'
}

createCa() {
  mkdir -p $(caPath)
  mkdir -p $(certificatesPath)

  caPemPath=$(caPath)'/WARPLocalhostCASelfSigned.pem'
  caKeyPath=$(caPath)'/WARPLocalhostCASelfSigned.key'

  echo $caPemPath
  echo $caKeyPath

  oName='WARP Localhost CA Self Signed Organization';
  cName='WARP Localhost CA Self Signed CN';
  eName='rootcertificate@warp.localhost';

  # Check if CA exists and delete it from filesystem and Keychain
  # optional - can keep
  # rm -r $caPemPath
  # rm -r $caKeyPath
  rm -rf $(caPath)/*

  sudo security delete-certificate -c "${cName}" /Library/Keychains/System.keychain

  # If CA and root certificates are nonexistent, crete them
  openssl req -new -newkey rsa:2048 -days 730 -nodes -x509 -subj "/C=/ST=/O=${oName}/localityName=/commonName=${cName}/organizationalUnitName=Developers/emailAddress=${eName}/" -keyout "$caKeyPath" -out "$caPemPath"

  # Trust the given root certificate file in the Mac Keychain
  sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain "${caPemPath}"

}

createCertificateLocalhost() {
  caPemPath=$(caPath)'/WARPLocalhostCASelfSigned.pem'
  caKeyPath=$(caPath)'/WARPLocalhostCASelfSigned.key'
  caSrlPath=$(caPath)'/WARPLocalhostCASelfSigned.srl'

  keyPath=$(certificatesPath)'/localhost.key'
  csrPath=$(certificatesPath)'/localhost.csr'
  crtPath=$(certificatesPath)'/localhost.crt'
  confPath=$(certificatesPath)'/localhost.conf'

  eName='localhost@warp.localhost';

  # Delete certificates from FS and keychain
  rm -rf $(certificatesPath)/localhost.*
  sudo security find-certificate -e "${eName}" -a -Z | grep SHA-1 | sudo awk '{system("security delete-certificate -Z '\$NF' /Library/Keychains/System.keychain")}'

  # copy over openssl conf
  DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
  cp -f $DIR'/openssl-template.conf' $confPath

  # Create private key
  openssl genrsa -out "${keyPath}" 2048

  # Create signing request
  openssl req -new -key "${keyPath}" -out "${csrPath}" -subj "/C=/ST=/O=/localityName=/commonName=localhost/organizationalUnitName=/emailAddress=${eName}/" -config "${confPath}"

  # -CAcreateserial has to be called only if CA does not exist
  # as this script on each run deletes CA (if exists), and regenerates it, it is the case

  # caSrlParam='-CAserial "'${caSrlPath}'" -CAcreateserial';
  caSrlParam='-CAcreateserial'

  openssl x509 -req -sha256 -days 730 -CA "${caPemPath}" -CAkey "${caKeyPath}" ${caSrlParam} -in "${csrPath}" -out "${crtPath}" -extensions v3_req -extfile "${confPath}"

  sudo security add-trusted-cert -d -r trustAsRoot -k /Library/Keychains/System.keychain "${crtPath}"
}

createCa
createCertificateLocalhost
