#!/usr/bin/env python3
import sys
import os

# Change to agent-looper directory so it can find .saia-keys
os.chdir('/opt/git/agent-looper')
sys.path.insert(0, '/opt/git/agent-looper')

from src.core.saia_agent import SAIAAgent

agent = SAIAAgent(model="meta-llama-3.1-8b-instruct")

task = """
I need to find a correct ResearchGate publication link.

The broken URL is: https://www.researchgate.net/publication/385576780_Eine_interdisziplinare_Kooperation_in_der_Hochschullehre_mit_Hilfe_der_virtuellen_Realitat_Status_Quo_eines_Lernraum_Projekts_das_mittels_Mozilla_Hubs_das_Periodensystem_der_Elemente_sowie_experimente

This appears to be a German academic publication. The publication number might be incorrect.

Can you suggest:
1. What the correct approach would be to find this publication
2. Alternative solutions if we can't find the exact publication
3. Whether we should just remove or comment out the broken link
"""

response = agent.chat(task)
print(response)
