import moment from "moment";

export default function buildReviewFilter({ isReviewDashboard }) {
  if (!isReviewDashboard) {
    return [];
  }

  const now = moment().toISOString();
  const oneWeekFromNow = moment().add(7, "days").toISOString();

  // Temporary condition to exclude advisories that haven't been created recently.
  // @TODO: Remove this cutoff after migration verification is complete.
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
            // Published/scheduled/submitted advisories that still require review
            {
              $and: [
                {
                  advisoryStatus: {
                    code: {
                      $in: ["PUB", "SCH", "HQR"],
                    },
                  },
                },
                {
                  reviewedAt: {
                    $null: true,
                  },
                },
                {
                  reviewedByName: {
                    $null: true,
                  },
                },
                // Temporary condition
                {
                  createdAt: {
                    $between: [oneMonthAgo, now],
                  },
                },
              ],
            },
            // Scheduled/submitted advisories that are updated
            {
              $and: [
                {
                  advisoryStatus: {
                    code: {
                      $in: ["HQR", "SCH"],
                    },
                  },
                },
                {
                  createdAt: {
                    $notNull: true,
                  },
                },
                {
                  modifiedDate: {
                    $notNull: true,
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
