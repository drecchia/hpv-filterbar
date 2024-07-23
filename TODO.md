TODO:
-----
ctx.invalidateRulesCache();
searchable=false
Define selector idx position
Criar fn para ser executada quando componentes do floating containers forem alterados, eliminando chamadas qdo nao há alteracoes, disparando chamada remota ( como é feito hj, hack no attachDropDown ? )
Reestructure component
Improove callbacks
Move afterRemoveFromBar from context to selector
create an selector map inside context for multiples instances usage
Support multiples Instances

BUGS:
-----
re-add selector are not comming back in getMergedRules()