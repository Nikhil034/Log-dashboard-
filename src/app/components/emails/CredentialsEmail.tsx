import { Html, Body, Container, Text, Heading } from "@react-email/components";
import * as React from "react";

type CredentialsEmailProps = {
  email: string;
  password: string;
};

export const CredentialsEmail = ({ email, password }: CredentialsEmailProps) => (
  <Html>
    <Body style={{ backgroundColor: "#f8f8f8", fontFamily: "Arial, sans-serif", padding: "20px" }}>
      <Container style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "8px" }}>
        <Heading style={{ color: "#4a90e2" }}>Resource granted!</Heading>
        <Text>Here are your credentials:</Text>
        <Text>
          <strong>Email:</strong> {email} <br />
          <strong>Password:</strong> {password}
        </Text>
        <Text style={{ fontSize: "12px", color: "#888" }}>
          Lampros Tech © {new Date().getFullYear()}
        </Text>
      </Container>
    </Body>
  </Html>
);
