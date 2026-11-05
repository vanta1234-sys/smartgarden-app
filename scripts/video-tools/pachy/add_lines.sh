#!/bin/sh
# usage: sh add_lines.sh < "label id id id ..." lines  ->  add_cands.cjs
while read label ids; do for id in $ids; do echo "$id $label"; done; done | node "$(dirname "$0")/add_cands.cjs"
