# Skills Map — What to Install Per Phase & Stack

## Always Installed (base kit)

<template>
  <div class="flex flex-col items-center">
    <h1>Always Installed (base kit)</h1>
    <ul>
      <li>
        <VercelLabsSkill /> 
        — skill discovery
      </li>
      <li>
        <WshobsonAgentsCodeReviewExcellence />
        — code quality review
      </li>
      <li>
        <HieutrtrAISkillsCodeReviewSecurity />
        — security review
      </li>
      <li>
        <AnthropicsSkillsWebappTesting />
        — webapp testing
      </li>
      <li>
        UiUxDesignReview 
      </li>
    </ul>
  </div>
</template>

<script>
import VercelLabsSkill from './VercelLabsSkill.vue'
import WshobsonAgentsCodeReviewExcellence from './WshobsonAgentsCodeReviewE[28D[K
'./WshobsonAgentsCodeReviewExcellence.vue'
import HieutrtrAISkillsCodeReviewSecurity from './HieutrtrAISkillsCodeRevie[28D[K
'./HieutrtrAISkillsCodeReviewSecurity.vue'
import AnthropicsSkillsWebappTesting from './AnthropicsSkillsWebappTesting.[33D[K
'./AnthropicsSkillsWebappTesting.vue'
import UiUxDesignReview from './UiUxDesignReview.vue'

export default {
  components: {
    VercelLabsSkill,
    WshobsonAgentsCodeReviewExcellence,
    HieutrtrAISkillsCodeReviewSecurity,
    AnthropicsSkillsWebappTesting,
    UiUxDesignReview
  }
}
</script>

<style scoped>
ul {
  list-style-type: none;
  padding: 0;
}

li {
  margin-bottom: 1em;
}

li::before {
  content: "- ";
  color: #ccc;
}

h1 {
  color: blue;
}
</style>
