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
        // Exclude advisories that are already marked as reviewed
        {
          $or: [
            {
              reviewedByName: {
                $null: true,
              },
            },
            {
              reviewedDate: {
                $null: true,
              },
            },
          ],
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
                  unpublishedDate: {
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
                  reviewedDate: {
                    $null: true,
                  },
                },
                {
                  reviewedByName: {
                    $null: true,
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
