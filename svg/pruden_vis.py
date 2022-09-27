import pygraphviz as pgv
import networkx as nx

def layer_assign(rule_node_ls, rule_body, rule_head, node_layer):
    if len(rule_node_ls)!=0:
        for rule_id in rule_node_ls:
            rule_body_literals=rule_body[rule_id]
            assigned_nodes=list(node_layer.keys())
            is_subset = set(rule_body_literals).issubset(set(assigned_nodes))
            if is_subset==True:
                layer_info=[node_layer[key] for key in rule_body_literals]
                node_layer[rule_id]=max(layer_info)+1
                node_layer[rule_head[rule_id]]=max(layer_info)+2
                rule_node_ls.remove(rule_id)
        layer_assign(rule_node_ls, rule_body, rule_head, node_layer)
    else:
        return(node_layer)
    
def prepare_vis(data):
    
    context=[]

    for con_info in data["context"]:
        context.append(con_info["name"])
        node_layer[con_info["name"]]=0
    
    rule_node_ls=[]
    edges_ls=[]
    
    keys=data["graph"].keys()
    for key in keys:
        rule=data["graph"][key]
        
        for dict_id in range(len(rule)):
            #rule level
            rule_name="Rule:"+rule[dict_id]["name"]
            rule_node_ls.append(rule_name)

            #body
            rule_body=rule[dict_id]["body"]
            for literal in rule_body:
                if literal["sign"] == False:
                    edges_ls.append(("-"+literal["name"], rule_name))
                else:
                    edges_ls.append((literal["name"], rule_name))
            #head 
            rule_head=rule[dict_id]["head"]

            if rule_head["sign"]==False:
                edges_ls.append((rule_name,"-"+rule_head["name"]))
            else:
                edges_ls.append((rule_name,rule_head["name"]))
    
    defeated_rule_node_ls=[]
    defeated_rule_body=[]
    defeated_edges_ls=[]
    
    for index in range(len(data["defeatedRules"])):
        rule=data["defeatedRules"][index]["defeated"]
        rule_name="Rule:"+rule["name"]
        defeated_rule_node_ls.append(rule_name)

        #body
        defeated_rule_body=rule["body"]
        for literal in defeated_rule_body:
            if literal["sign"] == False:
                defeated_edges_ls.append(("-"+literal["name"], rule_name))
            else:
                defeated_edges_ls.append((literal["name"], rule_name))
        #head 
        rule_head=rule["head"]
        if rule_head["sign"]==False:
            defeated_edges_ls.append((rule_name,"-"+rule_head["name"]))
        else:
            defeated_edges_ls.append((rule_name,rule_head["name"]))

    
    node_layer={}
    
    rule_body={}
    rule_head={}

    for rule_id in rule_node_ls+defeated_rule_node_ls:
        rule_body_literals=[]
        for edge in edges_ls + defeated_edges_ls :
            if rule_id == edge[1]:
                rule_body_literals.append(edge[0])
            if rule_id ==edge[0]:
                rule_head_literals=edge[1]

        rule_body[rule_id]=rule_body_literals
        rule_head[rule_id]=rule_head_literals
    
    
    return(rule_node_ls+defeated_rule_node_ls, rule_body, rule_head, node_layer,edges_ls,defeated_rule_node_ls, defeated_edges_ls)


def vis_pruden(node_layer,edges_ls,defeated_rule_node_ls, defeated_edges_ls):
    G = nx.DiGraph(rankdir="LR")

    ## add node
    for node in list(node_layer.keys()):
        if node[0]=="R":
            G.add_node(node[5:], shape="box",style="rounded")
        else:
            if node[0]=="-":
                G.add_node(node[1:])
            else:
                G.add_node(node)
    
     ## add defeated_rule_node_ls
    for node in defeated_rule_node_ls:
        if node[0]=="R":
            G.add_node(node[5:], shape="box",style="rounded", color="#e7e7e7")
        else:
            if node[0]=="-":
                G.add_node(node[1:],color="#e7e7e7")
            else:
                G.add_node(node,color="#e7e7e7")
    
    #add edge
    for edge in edges_ls:

        #leterals to rules
        if edge[1][0]=="R":
            if edge[0][0]=="-":  # negation to rule
                G.add_edge(edge[0][1:], edge[1][5:], color="#ff6262")
            else: # positive literal to rule
                G.add_edge(edge[0], edge[1][5:],color="#a2e665")
        else: 
        # rule to literal
            if edge[1][0]=="-":
                G.add_edge(edge[0][5:], edge[1][1:],color="#ff6262")
            else:
                G.add_edge(edge[0][5:], edge[1],color="#a2e665")
    
    #add defeated edge
    for edge in defeated_edges_ls:

        #leterals to rules
        if edge[1][0]=="R":
            if edge[0][0]=="-":  # negation to rule
                G.add_edge(edge[0][1:], edge[1][5:], color="#e7e7e7",style="dashed")
            else: # positive literal to rule
                G.add_edge(edge[0], edge[1][5:],color="#e7e7e7",style="dashed")
        else: 
        # rule to literal
            if edge[1][0]=="-":
                G.add_edge(edge[0][5:], edge[1][1:],color="#e7e7e7",style="dashed")
            else:
                G.add_edge(edge[0][5:], edge[1],color="#e7e7e7",style="dashed")
    
    #add rank
    A = nx.nx_agraph.to_agraph(G)

    for layer_id in set(node_layer.values()):
        node_ls=[node for node,layer in node_layer.items() if layer ==layer_id]
        # print(node_ls)
        A.add_subgraph(node_ls,rank='same')

    A.draw("file.svg",prog="dot")