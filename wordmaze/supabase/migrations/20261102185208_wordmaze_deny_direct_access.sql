create policy wordmaze_deny_direct_access on wordmaze_private.players as restrictive for all to public using (false) with check (false);
create policy wordmaze_deny_direct_access on wordmaze_private.animals as restrictive for all to public using (false) with check (false);
create policy wordmaze_deny_direct_access on wordmaze_private.inventory as restrictive for all to public using (false) with check (false);
create policy wordmaze_deny_direct_access on wordmaze_private.stages as restrictive for all to public using (false) with check (false);
create policy wordmaze_deny_direct_access on wordmaze_private.runs as restrictive for all to public using (false) with check (false);
create policy wordmaze_deny_direct_access on wordmaze_private.records as restrictive for all to public using (false) with check (false);
create policy wordmaze_deny_direct_access on wordmaze_private.ledger as restrictive for all to public using (false) with check (false);
