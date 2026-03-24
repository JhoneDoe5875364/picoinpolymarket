#!/usr/bin/env bash
systemctl show predictpix -p Environment \
| tr ' ' '\n' \
| sed -n 's/^Environment=//p' \
| tr ' ' '\n' \
| sort
