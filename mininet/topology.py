from mininet.topo import Topo
from mininet.net import Mininet
from mininet.node import Node
from mininet.cli import CLI
from mininet.link import TCLink

class ZTNATopo(Topo):
    def build(self):
        db = self.addHost('db')
        agent = self.addHost('agent')
        client = self.addHost('client')

        self.addLink(client, agent)
        self.addLink(agent, db)

if __name__ == '__main__':
    net = Mininet(topo=ZTNATopo(), link=TCLink)
    net.start()
    CLI(net)
    net.stop()
