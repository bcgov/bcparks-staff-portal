import moment from "moment";

export default function buildReviewFilter({ isReviewDashboard }) {
  if (!isReviewDashboard) {
    return [];
  }

  const now = moment().toISOString();
  const oneWeekFromNow = moment().add(7, "days").toISOString();

  return [
    {
      $and: [
        // Exclude draft advisories
        {
          advisoryStatus: {
            code: {
              $ne: "DFT",
            },
          },
        },
        {
          $or: [
            // Expiry date approaching within 1 week
            {
              expiryDate: {
                $between: [now, oneWeekFromNow],
              },
            },
            // Expired advisories
            {
              expiryDate: {
                $lte: now,
              },
            },
            // End date reached
            {
              endDate: {
                $lte: now,
              },
            },
            // Explicitly moved to unpublished by clicking "Unpublish"
            {
              $and: [
                {
                  advisoryStatus: {
                    code: {
                      $eq: "UNP",
                    },
                  },
                },
                {
                  reviewedAt: {
                    $notNull: true,
                  },
                },
              ],
            },
            // Submitted for review
            {
              advisoryStatus: {
                code: {
                  $eq: "HQR",
                },
              },
            },
            // Published/scheduled advisories that still require review
            {
              $and: [
                {
                  advisoryStatus: {
                    code: {
                      $in: ["PUB", "SCH"],
                    },
                  },
                },
                {
                  reviewedAt: {
                    $null: true,
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ];
}
