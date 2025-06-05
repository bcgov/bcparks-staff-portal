# Populate Park Tier1/Tier2 flags

The Park model has 2 columns: `hasTier1Dates` and `hasTier2Dates` that indicate if the Park has Tier1/Tier2 dates.
This script sets the flags based on provided JSON data.

This script is designed to run one time in each environment, to intially populate the fields. If the data changes, you can reset all the parks to "false" and re-run the script with a new JSON file.

Small updates can be done through AdminJS.
