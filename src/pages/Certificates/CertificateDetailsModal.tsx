import React from "react";
// PatternFly
import { Button, Content, Flex, FlexItem } from "@patternfly/react-core";
// Components
import TitleLayout from "src/components/layouts/TitleLayout";
// Modals
import InformationModalLayout from "src/components/layouts/InformationModalLayout";
// Data types
import { Certificate } from "src/utils/datatypes/globalDataTypes";
// Utils
import { parseDn } from "src/utils/utils";

interface PropsToCertDetailsModal {
  isOpen: boolean;
  onClose: () => void;
  certificate: Certificate | null;
}

const CertificateDetailsModal = (props: PropsToCertDetailsModal) => {
  const cert = props.certificate;

  const actions = [
    <Button
      data-cy="modal-button-close"
      key="close"
      variant="primary"
      onClick={props.onClose}
    >
      Close
    </Button>,
  ];

  const parseKeyValue = (key: string, value: string) => {
    return (
      <Flex
        direction={{ default: "column", md: "row" }}
        justifyContent={{ default: "justifyContentFlexStart" }}
        className="pf-v6-u-mt-sm"
      >
        <FlexItem className="pf-v6-u-mb-0" style={{ width: "200px" }}>
          <Content>{key}:</Content>
        </FlexItem>
        <FlexItem flex={{ default: "flex_1" }}>
          <Content>{value}</Content>
        </FlexItem>
      </Flex>
    );
  };

  const revocationReasonLabels: Record<number, string> = {
    0: "Unspecified",
    1: "Key compromise",
    2: "CA compromise",
    3: "Affiliation changed",
    4: "Superseded",
    5: "Cessation of operation",
    6: "Certificate hold",
    8: "Remove from CRL",
    9: "Privilege withdrawn",
    10: "AA compromise",
  };

  const content = (
    <>
      {cert !== null && (
        <>
          <TitleLayout
            id={"cert-detail-issued-to"}
            headingLevel="h2"
            text={"Issued to"}
          />
          {parseKeyValue(
            "Common name",
            cert.subject ? parseDn(cert.subject).cn || "" : ""
          )}
          {parseKeyValue(
            "Organization",
            cert.subject ? parseDn(cert.subject).o || "" : ""
          )}
          {parseKeyValue(
            "Organization unit",
            cert.subject ? parseDn(cert.subject).ou || "" : ""
          )}
          {parseKeyValue("Serial number (hex)", cert.serial_number_hex || "")}
          <TitleLayout
            id={"cert-detail-issued-by"}
            headingLevel="h2"
            text={"Issued by"}
            className="pf-v6-u-mt-md"
          />
          {parseKeyValue(
            "Common name",
            cert.issuer ? parseDn(cert.issuer).cn || "" : ""
          )}
          {parseKeyValue(
            "Organization",
            cert.issuer ? parseDn(cert.issuer).o || "" : ""
          )}
          {parseKeyValue(
            "Organization unit",
            cert.issuer ? parseDn(cert.issuer).ou || "" : ""
          )}
          <TitleLayout
            id={"cert-detail-validity"}
            headingLevel="h2"
            text={"Validity"}
            className="pf-v6-u-mt-md"
          />
          {parseKeyValue("Issued on", cert.valid_not_before || "")}
          {parseKeyValue("Expires on", cert.valid_not_after || "")}
          <TitleLayout
            id={"cert-detail-fingerprints"}
            headingLevel="h2"
            text={"Fingerprints"}
            className="pf-v6-u-mt-md"
          />
          {parseKeyValue("SHA1 Fingerprint", cert.sha1_fingerprint || "")}
          {parseKeyValue("SHA256 Fingerprint", cert.sha256_fingerprint || "")}
          <TitleLayout
            id={"cert-detail-other"}
            headingLevel="h2"
            text={"Other details"}
            className="pf-v6-u-mt-md"
          />
          {parseKeyValue("Status", cert.status || "")}
          {parseKeyValue(
            "Owner",
            cert.owner_user ? cert.owner_user.join(", ") : ""
          )}
          {cert.revoked &&
            cert.revocation_reason !== undefined &&
            parseKeyValue(
              "Revocation reason",
              revocationReasonLabels[cert.revocation_reason] ||
                String(cert.revocation_reason)
            )}
        </>
      )}
    </>
  );

  const certSubject =
    cert && cert.subject ? parseDn(cert.subject).cn || cert.subject : "";

  return (
    <InformationModalLayout
      dataCy="certificate-details-modal"
      title={"Certificate for " + certSubject}
      variant="medium"
      actions={actions}
      isOpen={props.isOpen}
      onClose={props.onClose}
      content={content}
    />
  );
};

export default CertificateDetailsModal;
