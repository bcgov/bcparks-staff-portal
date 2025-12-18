# clean-up-seasons.js

This script looks for features that have two sets of dates in the same year.
One set of dates will be associated with the ParkArea, and the other set will be
associated with the Feature. The script ensures that the DateRanges with actual data
are associated with whichever entity is supposed to have DateRanges.
