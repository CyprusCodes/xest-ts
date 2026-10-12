interface LogMessage {
  successMessage: string;
  detailsMessage: string;
}

const digitalOcean: LogMessage = {
  successMessage: "Deployment files created successfully for Digital Ocean.",
  detailsMessage:
    "For more details on deploying to Digital Ocean, including creating your droplet and more, please visit: \x1b[34mhttps://xestjs.com/docs/digital-ocean\x1b[0m",
};

const aws: LogMessage = {
  successMessage: "Deployment files created successfully for AWS.",
  detailsMessage:
    "For more details on deploying to AWS, please visit: \x1b[34mhttps://xestjs.com/docs/aws-deployment\x1b[0m",
};

export { digitalOcean, aws };
