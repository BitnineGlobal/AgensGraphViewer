SELECT label, count(label)::INTEGER as cnt
FROM (
         SELECT ag_catalog._label_name(graphid, v)::text as label
         from cypher('%s', $$
             MATCH ()-[V]-()
             RETURN id(V)
             $$) as (V agtype), (SELECT graphid FROM ag_catalog.ag_graph where name = '%s') as graphid
     ) b
GROUP BY b.label;

-- TODO: COUNT needs AGE supporting or Client-side processing.
