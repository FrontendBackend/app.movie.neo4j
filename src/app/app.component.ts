import { Component } from '@angular/core';
import { Neo4jService } from './neo4j.service';
import { MatTableDataSource } from '@angular/material/table';
import cytoscape from 'cytoscape';

interface NodeData {
  id: string;
  label: string;
  type: string;
}

interface EdgeData {
  id: string;
  source: string;
  target: string;
  label: string;
}
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'ngx-pdf-viewer';

  busquedaTitle: string = '';

  cy: any;

  displayedColumns: string[] = ['label', 'acciones'];

  dataSource: any;

  listaDataPelicula = [];

  cantidadRegistros = 0;

  constructor(private neo4jService: Neo4jService) { }

  enProceso = false;

  ngOnInit(): void {
    // Inicializa el grafo sin datos
    this.initializeGraph([]);
  }

  mostrarGrafo(data: any) {
    const label = data.label;
    const titulolimpio = label.replace(/\s*\(.*?\)\s*$/, '');
    this.busquedaTitle = titulolimpio;
    console.log('tutlo: ',this.busquedaTitle);
    this.filterGraph()
  }

  async filterGraph(): Promise<void> {

    try {
      // const query = 'MATCH (n:Pelicula) RETURN n LIMIT 10'; // Consulta para obtener los primeros 10 nodos
      // const query = 'match p=shortestpath((:Usuario {descripcion: "Usuario 2"})-[*]-(:Usuario {descripcion: "Usuario 3"})) return p'; // Consulta para obtener los primeros 10 nodos
      const query = `MATCH p=shortestPath((m:Pelicula where m.title =~ "(?i).*${this.busquedaTitle}.*")<-[*]-(u:Usuario)) RETURN p`; // Consulta para obtener los primeros 10 nodos
      // const query = `${this.busquedaTitle}`; // Consulta para obtener los primeros 10 nodos
      // const query = `MATCH (n:Pelicula) WHERE n.title =~ '(?i).*${this.busquedaTitle}.*' RETURN n`; // Consulta para obtener los primeros 10 nodos
      const result = await this.neo4jService.consultar(query);
      console.log(result);
      const nodes: { data: NodeData }[] = [];
      const edges: { data: EdgeData }[] = [];
      let esSoloNodos = "";
      let elements: any = []
      if (result.length > 0) {

        // Procesar los resultados de la consulta para construir los nodos y las relaciones
        result.forEach(record => {
          if (record.n) {
            const n = record.n;
            esSoloNodos = "0"
            console.log('nododenode:', n);

            nodes.push({
              // group: 'nodes',
              data: {
                id: n.elementId,
                label: n.properties.title,
                type: n.labels[0],
              }
            });

          } else if (record.p.segments) {
            esSoloNodos = "1"
            const segments = record.p.segments;
            segments.forEach((segment: any) => {
              const startNode = segment.start;
              const endNode = segment.end;
              const relationship = segment.relationship;

              nodes.push({
                // group: 'nodes',
                data: {
                  id: startNode.elementId,
                  label:
                    startNode.labels.includes('Pelicula') ? startNode.properties.title :
                      startNode.labels.includes('Genre') ? startNode.properties.name :
                        startNode.properties.descripcion,
                  type: startNode.labels[0],
                }
              });

              nodes.push({
                // group: 'nodes',
                data: {
                  id: endNode.elementId,
                  label:
                    endNode.labels.includes('Pelicula') ? endNode.properties.title :
                      endNode.labels.includes('Genre') ? endNode.properties.name :
                        endNode.properties.descripcion,
                  type: endNode.labels[0],
                }
              });

              edges.push({
                // group: 'edges',
                data: {
                  id: relationship.elementId,
                  source: startNode.elementId,
                  target: endNode.elementId,
                  label: relationship.type
                }
              });

            });
          }
        });

        if (esSoloNodos === "0") {
          const uniqueNodes = Array.from(new Map(nodes.map(node => [node.data.id, node])).values());
          elements = [...uniqueNodes];
          console.log("esSoloNodos:", elements);
          this.updateGraph(elements);
        } else {
          // Convertir el Set a un array y eliminar duplicados
          const uniqueNodes = Array.from(new Map(nodes.map(node => [node.data.id, node])).values());
          elements = [...uniqueNodes, ...edges];
          // Agregar el nodo al array de películas si es de tipo Pelicula
          console.log('Nodos_relacionados:', elements);

          let pelicula = uniqueNodes.filter(peli => peli.data.type === 'Pelicula');
          let dataSource = new MatTableDataSource(pelicula);
          this.cantidadRegistros = pelicula.length;
          this.dataSource = dataSource.data;
          this.listaDataPelicula = this.dataSource;
          console.log('dataSource:', this.dataSource);

          this.updateGraph(elements);
        }
      }
    } catch (error) {
      console.error('Error al consultar datos desde Neo4j:', error);
    }
  }

  initializeGraph(elements: any[]): void {
    // Crear el grafo con Cytoscape
    this.cy = cytoscape({
      container: document.getElementById('cy'),
      elements: elements,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': function (ele) {
              if (ele.data('type') === 'Usuario') return '#F0A30A'; // Color amarillo
              if (ele.data('type') === 'Pelicula') return '#60A917'; // Color verde
              if (ele.data('type') === 'Genre') return '#1BA1E2'; // Color celeste
              return '#CCCCCC'; // Default color for other types
            },
            'label': 'data(label)',
            'shape': 'ellipse', // Mantener la forma de círculo
            'text-wrap': 'wrap', // Envolver texto
            'text-max-width': '80px', // Máximo ancho del texto dentro del nodo
            'text-valign': 'center',
            'text-halign': 'center',
            'color': '#fff',
            'font-size': '12px',
            'height': '80px', // Altura fija del nodo
            'width': '80px'  // Ancho fijo del nodo

            /* 'label': 'data(label)',
            'width': '120px',
            'height': '120px',
            'background-fit': 'cover',
            'border-color': '#000', */
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 10,
            // 'line-color': '#ccc',
            // 'target-arrow-color': '#ccc',
            'target-arrow-shape': 'triangle', // Forma de la flecha
            // 'curve-style': 'bezier', // Curva Bezier para las aristas
            'label': 'data(label)',
            'font-size': '10px',
            'text-rotation': 'autorotate',
            'text-margin-y': -10,
            'line-color': '#FAE6B4',
            'target-arrow-color': '#FAE6B4'
          }
        }
      ],
      layout: {
        name: 'cose',
        padding: 10,
        animate: true,
      },
    });

    this.cy.animate({
      pan: { x: 100, y: 100 },
      zoom: 2
    }, {
      duration: 1000
    });
  }

  updateGraph(elements: any[]): void {
    this.cy.json({ elements: elements });
    this.cy.layout({ name: 'cose', padding: 10 }).run();
  }

  /* listarPeliculas() {

    this.enProceso = true;

    this.pasoProcesoService.listarPasosProceso(idProceso, this.paginador).subscribe(respuesta => {

      let dataSource = new MatTableDataSource(respuesta.content);

      this.dataSourcePasosProceso = dataSource.data;
      this.lPgimPasoProcesoDTO = this.dataSourcePasosProceso;
      this.paginador.totalElements = respuesta.totalElements;
      this.cantidadRegistros = this.paginador.totalElements;

      this.enProceso = false;
    });
  } */

  async conectar(): Promise<void> {
    try {
      const query = 'MATCH (n:Pelicula) RETURN n LIMIT 10'; // Consulta para obtener los primeros 10 nodos
      const result = await this.neo4jService.consultar(query);

      if (result.length > 0) {
        console.log('Resultados de la consulta:');
        result.forEach((record: any) => {
          console.log(record);
        });
      } else {
        console.log('No se encontraron resultados para la consulta.');
      }
    } catch (error) {
      console.error('Error al consultar datos desde Neo4j:', error);
    }
  }
}
