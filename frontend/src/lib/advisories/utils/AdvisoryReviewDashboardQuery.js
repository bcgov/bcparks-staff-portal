import moment from "moment";

export default function buildReviewFilter({ isReviewDashboard }) {
  if (!isReviewDashboard) {
    return [];
  }

  const now = moment().toISOString();
  const oneWeekFromNow = moment().add(7, "days").toISOString();

  // Temporary condition to exclude stale advisories that haven't been updated recently and aren't relevant to the review dashboard.
  // TODO - Remove this cutoff after migration verification is complete.
  const oneMonthAgo = moment().subtract(1, "month").toISOString();

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
                  unpublishedByName: {
                    $notNull: true,
                  },
                },
                {
                  unpublishedAt: {
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
                // Temporary condition
                {
                  $or: [
                    {
                      updatedAt: {
                        $between: [oneMonthAgo, now],
                      },
                    },
                    {
                      updatedDate: {
                        $between: [oneMonthAgo, now],
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ];
}
