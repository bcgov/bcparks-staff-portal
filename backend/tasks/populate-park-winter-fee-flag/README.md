# Populate Park Winter fee dates flags

The Park model has a `hasWinterFeeDates` flag column that indicates if the Park has Winter fee dates.
This script sets the flag based on provided JSON data.

This script is designed to run one time in each environment, to intially populate the field. If the data changes, you can reset all the parks to "false" and re-run the script with a new JSON file.

Small updates can be done through AdminJS.
