from flask import Flask, render_template, request, jsonify
import pygraphviz as pgv
from flask_cors import CORS

def get_layer_info(graph_matrix, node_info):
    graph = pgv.AGraph(directed=True)
    
    # Create nodes and edges based on the input graph_matrix
    for i, row in enumerate(graph_matrix):
        graph.add_node(i, label=node_info[i])  # Add node with label from node_info
        for j, value in enumerate(row):
            if value != 0:
                graph.add_edge(i, j)

    graph.layout(prog='dot')
    
    layers = {}
    for node in graph.nodes():
        # Using the node label instead of the node index as the key
        layers[node_info[int(node)]] = float(node.attr['pos'].split(",")[1])

    unique_layers = sorted(set(layers.values()), reverse=True)
    layer_mapping = {layer: i + 1 for i, layer in enumerate(unique_layers)}
    
    # Adjusting keys to be node labels instead of indices
    node_to_layer = {node_info[int(node)]: layer_mapping[layers[node_info[int(node)]]] - 1 for node in graph.nodes()}
    
    layer_summary = {}
    for layer in node_to_layer.values():
        layer_summary[layer] = layer_summary.get(layer, 0) + 1
    
    layers = {"layers":node_to_layer, "layerCounts": layer_summary}
    return layers


app = Flask(__name__, template_folder='.', static_folder='static', static_url_path='/static')
CORS(app, origins=['https://fictional-robot-jrq9q76qqpv3qwgw-5000.app.github.dev'])

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get_layer_info', methods=['POST'])
def get_layer_info_route():
    data = request.json
    graph_matrix = data.get('graph_matrix', [])
    node_info = data.get('node_info', {})
    layers = get_layer_info(graph_matrix, node_info)
    return jsonify(layers)


if __name__ == '__main__':
    app.run(debug=True)
